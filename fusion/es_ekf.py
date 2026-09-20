"""
15-State Error-State Kalman Filter (ES-EKF) / Invariant EKF Fusion Engine.
Orchestrates vehicular mechanization, Non-Holonomic Constraints (NHC),
and the 6 Unique Dead Reckoning Features:
1. Dynamic Process-Noise Adaptation
2. Stop-Based Drift Correction (ZUPT & RTS Retro-Correction)
3. AI Fallback Mechanism
4. Seamless GNSS Switching
5. Confidence-Aware Navigation
6. Optional Camera Assistance
"""

import math
from typing import Dict, List, Optional, Tuple

from core.matrix_math import (
    Mat, quat_mult, quat_normalize, quat_to_dcm, quat_to_euler,
    euler_to_quat, quat_from_axis_angle, rotate_vec_by_quat,
    skew_symmetric, vec3_norm
)
from core.types import (
    SensorFrame, VehicleState, ConfidenceMetrics, NavigationMode,
    DisturbanceType, GNSSData
)
from core.coordinate_transforms import geodetic_to_enu, enu_to_geodetic
from core.virtual_alignment import PhoneVirtualAligner
from ai_models.network import DeepIMUInferenceEngine

from fusion.dynamic_noise import DynamicNoiseAdapter
from fusion.stop_correction import StopDriftCorrector
from fusion.fallback_arbiter import AIFallbackArbiter
from fusion.gnss_switcher import SeamlessGNSSSwitcher
from fusion.confidence_tracker import ConfidenceTracker
from fusion.visual_odometry_assist import VisualOdometryAssist


class DeadReckoningFusionEngine:
    def __init__(self,
                 ref_lat: float = 37.7749,
                 ref_lon: float = -122.4194,
                 ref_alt: float = 25.0,
                 sample_rate_hz: float = 50.0):
        self.ref_lat = ref_lat
        self.ref_lon = ref_lon
        self.ref_alt = ref_alt
        self.sample_rate_hz = sample_rate_hz
        self.dt = 1.0 / sample_rate_hz

        # Gravity in Local ENU: [East, North, Up] -> [0, 0, -9.80665]
        self.g_enu = [0.0, 0.0, -9.80665]

        # -------------------------------------------------------------
        # Nominal States
        # -------------------------------------------------------------
        self.pos_enu = [0.0, 0.0, 0.0]        # [pE, pN, pU] in meters
        self.vel_enu = [0.0, 0.0, 0.0]        # [vE, vN, vU] in m/s
        self.heading_rad = 0.0                # Heading in radians clockwise from North
        self.quat = [1.0, 0.0, 0.0, 0.0]      # Attitude quaternion [qw, qx, qy, qz]
        self.accel_bias = [0.0, 0.0, 0.0]     # [bx, by, bz] in m/s^2
        self.gyro_bias = [0.0, 0.0, 0.0]      # [bgx, bgy, bgz] in rad/s

        # 15x15 Error-State Covariance Matrix P
        # [delta_p(3), delta_v(3), delta_theta(3), delta_ba(3), delta_bg(3)]
        p_diag = [
            2.0**2, 2.0**2, 4.0**2,            # Pos: 2m horizontal, 4m vertical
            0.5**2, 0.5**2, 0.5**2,            # Vel: 0.5 m/s
            (math.radians(2.0))**2,            # Att: 2 deg
            (math.radians(2.0))**2,
            (math.radians(5.0))**2,
            0.05**2, 0.05**2, 0.05**2,         # Accel bias: 0.05 m/s^2
            0.005**2, 0.005**2, 0.005**2       # Gyro bias: 0.005 rad/s
        ]
        self.P = Mat.diag(p_diag)

        # -------------------------------------------------------------
        # Subsystems & Feature Engines
        # -------------------------------------------------------------
        self.aligner = PhoneVirtualAligner(sample_rate_hz=sample_rate_hz)
        self.ai_engine = DeepIMUInferenceEngine(window_size=40)

        self.noise_adapter = DynamicNoiseAdapter()             # Feature 1
        self.stop_corrector = StopDriftCorrector()            # Feature 2
        self.fallback_arbiter = AIFallbackArbiter()           # Feature 3
        self.gnss_switcher = SeamlessGNSSSwitcher()           # Feature 4
        self.confidence_tracker = ConfidenceTracker()         # Feature 5
        self.camera_assist = VisualOdometryAssist()           # Feature 6

        self.current_mode = NavigationMode.GNSS_AIDED
        self.latest_confidence = self.confidence_tracker.compute_metrics(self.P, True, self.dt)
        self.step_count = 0
        self.last_gnss_point: Optional[Tuple[float, float]] = None

    def initialize_state(self, lat: float, lon: float, alt: float, heading_deg: float):
        """Initializes the filter with starting geodetic anchor and heading."""
        self.ref_lat = lat
        self.ref_lon = lon
        self.ref_alt = alt
        self.pos_enu = [0.0, 0.0, 0.0]
        self.vel_enu = [0.0, 0.0, 0.0]

        # Convert heading (0=North, 90=East) to quaternion
        # In ENU: yaw is measured CCW from East, or heading CW from North.
        yaw_rad = math.radians(heading_deg)
        self.quat = euler_to_quat(0.0, 0.0, yaw_rad)

    def process_frame(self, frame: SensorFrame) -> VehicleState:
        """
        Main processing pipeline executed per sensor frame (50 Hz).
        """
        t = frame.timestamp
        self.step_count += 1

        # 1. Virtual Alignment & Coordinate Transformation (Phone -> Vehicle Frame)
        if not self.aligner.is_aligned:
            # Still calibrating phone orientation
            v_gnss = frame.gnss.speed_mps if (frame.gnss and frame.gnss.is_valid) else 0.0
            self.aligner.feed_stationary_imu(frame.accel, frame.gyro)
            if frame.gnss and frame.gnss.is_valid:
                self.aligner.feed_dynamic_imu(frame.accel, v_gnss, True)

        # Check phone handling disturbance
        is_phone_handled = self.aligner.check_phone_handling_disturbance(frame.accel, frame.gyro)

        # Transform raw IMU from phone frame into aligned vehicle body frame
        a_body = self.aligner.transform_vector(frame.accel)
        w_body = self.aligner.transform_vector(frame.gyro)

        # 2. AI Kinematics & Road Analysis (Feature 1, 3, 5)
        self.ai_engine.push_sample(a_body, w_body)
        ai_pred = self.ai_engine.predict()

        # Feature 3: Evaluate AI Fallback Arbiter
        nav_mode, ai_trust = self.fallback_arbiter.evaluate(
            ai_pred["uncertainty"],
            ai_pred["disturbance"],
            is_phone_handled
        )

        # 3. Strapdown Inertial Mechanization & Prediction
        # Subtract estimated biases
        a_unbiased = [
            a_body[0] - self.accel_bias[0],
            a_body[1] - self.accel_bias[1],
            a_body[2] - self.accel_bias[2]
        ]
        w_unbiased = [
            w_body[0] - self.gyro_bias[0],
            w_body[1] - self.gyro_bias[1],
            w_body[2] - self.gyro_bias[2]
        ]

        # Integrate heading angle directly from yaw rate in vehicle body (+Z is Down)
        dt = self.dt
        self.heading_rad = (self.heading_rad + w_unbiased[2] * dt) % (2.0 * math.pi)

        # Construct Vehicle-to-ENU Direction Cosine Matrix (DCM)
        # Vehicle Frame: X: Forward, Y: Right, Z: Down
        # ENU Frame:     X: East,    Y: North, Z: Up
        cy = math.cos(self.heading_rad)
        sy = math.sin(self.heading_rad)
        R = Mat([
            [sy,   cy,   0.0],
            [cy,  -sy,   0.0],
            [0.0,  0.0, -1.0]
        ])

        # Vehicle acceleration rotated to ENU
        a_enu = [
            R[0][0]*a_unbiased[0] + R[0][1]*a_unbiased[1] + R[0][2]*a_unbiased[2],
            R[1][0]*a_unbiased[0] + R[1][1]*a_unbiased[1] + R[1][2]*a_unbiased[2],
            R[2][0]*a_unbiased[0] + R[2][1]*a_unbiased[1] + R[2][2]*a_unbiased[2]
        ]
        # Net acceleration removing gravity in ENU
        a_net = [
            a_enu[0] + self.g_enu[0],
            a_enu[1] + self.g_enu[1],
            a_enu[2] + self.g_enu[2]
        ]

        # State Integration
        self.pos_enu[0] += self.vel_enu[0] * dt + 0.5 * a_net[0] * dt * dt
        self.pos_enu[1] += self.vel_enu[1] * dt + 0.5 * a_net[1] * dt * dt
        self.pos_enu[2] += self.vel_enu[2] * dt + 0.5 * a_net[2] * dt * dt

        self.vel_enu[0] += a_net[0] * dt
        self.vel_enu[1] += a_net[1] * dt
        self.vel_enu[2] += a_net[2] * dt

        # Update attitude quaternion
        self.quat = euler_to_quat(0.0, 0.0, self.heading_rad)

        # 4. Error-State Covariance Propagation
        # Feature 1: Dynamic Process Noise Adaptation
        Q_adapted = self.noise_adapter.compute_adapted_q(dt, ai_pred["dynamic_q_scale"])

        # Construct 15x15 state transition matrix F
        # F = I + [ dPos/dVel=I*dt; dVel/dTheta=-[R*a]_x*dt, dVel/dBa=-R*dt; dTheta/dBg=-R*dt ]
        F = Mat.eye(15)
        for i in range(3):
            F[i][i + 3] = dt # dPos / dVel
            F[i + 3][i + 9] = -R[i][i] * dt # dVel / dBa
            F[i + 6][i + 12] = -R[i][i] * dt # dTheta / dBg

        # Skew-symmetric cross product for attitude-velocity coupling
        a_cross = skew_symmetric(a_enu)
        for r in range(3):
            for c in range(3):
                F[r + 3][c + 6] = -a_cross[r][c] * dt

        # P = F * P * F^T + Q
        self.P = (F * self.P * F.T) + Q_adapted

        # 5. Non-Holonomic Constraints (NHC)
        # Vehicle cannot move sideways (v_y = 0) or vertically (v_z = 0) in body frame
        if self.step_count % 2 == 0:
            self._apply_nhc_constraint(R)

        # 6. Feature 2: Stop-Based Drift Correction (ZUPT + Retro-Correction)
        fwd_speed = math.sqrt(self.vel_enu[0]**2 + self.vel_enu[1]**2)
        standstill = self.stop_corrector.check_standstill(t, fwd_speed, w_body, a_body)

        if standstill:
            nav_mode = NavigationMode.ZUPT_CORRECTED
            # Apply ZUPT: zero-velocity measurement update
            self._apply_velocity_measurement([0.0, 0.0, 0.0], var=0.01**2)

            # Record stop anchor and trigger backward retro-smoothing
            current_anchor = (self.pos_enu[0], self.pos_enu[1])
            self.stop_corrector.apply_retro_correction(current_anchor)

        # Record trajectory step for potential retro-correction
        cov_diag = [self.P[i][i] for i in range(3)]
        self.stop_corrector.record_step(t, self.pos_enu[0], self.pos_enu[1], self.pos_enu[2], fwd_speed, cov_diag)

        # 7. Feature 6: Optional Camera Visual Odometry
        if frame.camera_flow and frame.camera_flow.is_valid and self.camera_assist.is_enabled:
            vo_res = self.camera_assist.compute_visual_update(frame.camera_flow, fwd_speed)
            if vo_res is not None:
                v_cam, var_cam = vo_res
                self._apply_forward_speed_measurement(v_cam, var_cam, R)

        # 8. Feature 4: Seamless GNSS Switching
        has_gnss = (frame.gnss is not None and frame.gnss.is_valid)
        use_gnss, _, beta = self.gnss_switcher.process_gnss(t, frame.gnss, self.pos_enu)

        if use_gnss and frame.gnss is not None:
            nav_mode = NavigationMode.GNSS_AIDED
            # Transform GNSS lat/lon to ENU
            gnss_e, gnss_n, gnss_u = geodetic_to_enu(
                frame.gnss.lat, frame.gnss.lon, frame.gnss.alt,
                self.ref_lat, self.ref_lon, self.ref_alt
            )
            # Feature 4: Apply innovation damping beta (no sudden jump)
            meas_var = (frame.gnss.horizontal_accuracy_m ** 2) / max(0.01, beta)
            self._apply_position_measurement([gnss_e, gnss_n, gnss_u], var=meas_var)
            self.last_gnss_point = (gnss_e, gnss_n)

            # Keep AI speed engine synchronized to ground truth while GNSS is healthy
            self.ai_engine.calibrate_speed(frame.gnss.speed_mps)

            # Continuous heading and gyro bias alignment from GNSS track when moving
            if frame.gnss.speed_mps > 2.5:
                gnss_bearing_rad = math.radians(frame.gnss.bearing_deg)
                heading_err = (gnss_bearing_rad - self.heading_rad + math.pi) % (2.0 * math.pi) - math.pi
                self.heading_rad = (self.heading_rad + 0.1 * heading_err) % (2.0 * math.pi)
                self.gyro_bias[2] -= 0.05 * heading_err * self.dt
        else:
            if not standstill and nav_mode != NavigationMode.AI_FALLBACK_IEKF:
                nav_mode = NavigationMode.TUNNEL_DR

            # If inside tunnel and AI is trusted, apply AI forward speed aid
            if ai_trust > 0.0 and ai_pred["speed_mps"] > 0.5:
                var_ai = (0.8 / max(0.1, ai_trust)) ** 2
                self._apply_forward_speed_measurement(ai_pred["speed_mps"], var_ai, R)

        self.current_mode = nav_mode

        # 9. Feature 5: Confidence-Aware Navigation
        self.latest_confidence = self.confidence_tracker.compute_metrics(
            self.P, has_gnss, self.dt
        )

        # 10. Assemble Output VehicleState
        lat, lon, alt = enu_to_geodetic(
            self.pos_enu[0], self.pos_enu[1], self.pos_enu[2],
            self.ref_lat, self.ref_lon, self.ref_alt
        )
        heading_deg = (math.degrees(self.heading_rad) + 360.0) % 360.0

        return VehicleState(
            timestamp=t,
            position_enu=self.pos_enu[:],
            lat=lat,
            lon=lon,
            alt=alt,
            velocity_enu=self.vel_enu[:],
            speed_mps=fwd_speed,
            quat=self.quat[:],
            roll_deg=0.0,
            pitch_deg=0.0,
            yaw_deg=heading_deg,
            accel_bias=self.accel_bias[:],
            gyro_bias=self.gyro_bias[:],
            pos_std_m=[math.sqrt(max(0.0, self.P[i][i])) for i in range(3)],
            vel_std_mps=[math.sqrt(max(0.0, self.P[i+3][i+3])) for i in range(3)],
            mode=self.current_mode,
            confidence=self.latest_confidence,
            dynamic_q_scale=ai_pred["dynamic_q_scale"],
            detected_disturbance=ai_pred["disturbance"],
            ai_uncertainty_score=ai_pred["uncertainty"]
        )

    # -----------------------------------------------------------------
    # Kalman Measurement Updates (NHC, Position, Velocity, Speed)
    # -----------------------------------------------------------------
    def _apply_nhc_constraint(self, R: Mat):
        """Non-Holonomic Constraints: Lateral and Vertical body velocity = 0."""
        # Body velocity: v_b = R^T * v_enu
        # v_lat = R[0][1]*vE + R[1][1]*vN + R[2][1]*vU
        # v_vert = R[0][2]*vE + R[1][2]*vN + R[2][2]*vU
        vE, vN, vU = self.vel_enu
        v_lat = R[0][1]*vE + R[1][1]*vN + R[2][1]*vU
        v_vert = R[0][2]*vE + R[1][2]*vN + R[2][2]*vU

        # Innovations
        y_lat = 0.0 - v_lat
        y_vert = 0.0 - v_vert

        # Measurement noise variance for NHC
        r_nhc = 0.15**2

        # Apply scalar updates for lateral & vertical body constraints
        h_lat = [0.0]*15
        h_lat[3] = R[0][1]
        h_lat[4] = R[1][1]
        h_lat[5] = R[2][1]
        self._scalar_kalman_update(h_lat, y_lat, r_nhc)

        h_vert = [0.0]*15
        h_vert[3] = R[0][2]
        h_vert[4] = R[1][2]
        h_vert[5] = R[2][2]
        self._scalar_kalman_update(h_vert, y_vert, r_nhc)

    def _apply_position_measurement(self, pos_meas: List[float], var: float):
        """Updates filter with 3D ENU position."""
        for i in range(3):
            y = pos_meas[i] - self.pos_enu[i]
            h = [0.0]*15
            h[i] = 1.0
            self._scalar_kalman_update(h, y, var)

    def _apply_velocity_measurement(self, vel_meas: List[float], var: float):
        """Updates filter with 3D ENU velocity (e.g. ZUPT)."""
        for i in range(3):
            y = vel_meas[i] - self.vel_enu[i]
            h = [0.0]*15
            h[i + 3] = 1.0
            self._scalar_kalman_update(h, y, var)

    def _apply_forward_speed_measurement(self, v_fwd_meas: float, var: float, R: Mat):
        """Updates filter with forward speed observation (AI or Camera)."""
        # Forward axis in vehicle body is X -> v_fwd = R[0][0]*vE + R[1][0]*vN + R[2][0]*vU
        vE, vN, vU = self.vel_enu
        current_fwd = R[0][0]*vE + R[1][0]*vN + R[2][0]*vU
        y = v_fwd_meas - current_fwd

        h = [0.0]*15
        h[3] = R[0][0]
        h[4] = R[1][0]
        h[5] = R[2][0]
        self._scalar_kalman_update(h, y, var)

    def _scalar_kalman_update(self, h: List[float], residual: float, r_var: float):
        """
        Numerically stable scalar measurement update:
        S = H * P * H^T + R
        K = P * H^T / S
        delta_x = K * residual
        P = (I - K * H) * P
        """
        # P * H^T
        ph_t = [0.0]*15
        for i in range(15):
            s = 0.0
            for j in range(15):
                s += self.P[i][j] * h[j]
            ph_t[i] = s

        # Innovation variance S
        s_var = r_var
        for i in range(15):
            s_var += h[i] * ph_t[i]

        if s_var < 1e-12:
            return

        inv_s = 1.0 / s_var

        # Kalman gain K = (P * H^T) / S
        k = [ph_t[i] * inv_s for i in range(15)]

        # State correction
        delta_x = [k[i] * residual for i in range(15)]

        # Apply corrections to nominal states
        self.pos_enu[0] += delta_x[0]
        self.pos_enu[1] += delta_x[1]
        self.pos_enu[2] += delta_x[2]

        self.vel_enu[0] += delta_x[3]
        self.vel_enu[1] += delta_x[4]
        self.vel_enu[2] += delta_x[5]

        # Attitude error quaternion
        dtheta = [delta_x[6], delta_x[7], delta_x[8]]
        angle = vec3_norm(dtheta)
        if angle > 1e-12:
            dq = quat_from_axis_angle(dtheta, angle)
            self.quat = quat_normalize(quat_mult(self.quat, dq))

        # Bias corrections
        self.accel_bias[0] += delta_x[9]
        self.accel_bias[1] += delta_x[10]
        self.accel_bias[2] += delta_x[11]

        self.gyro_bias[0] += delta_x[12]
        self.gyro_bias[1] += delta_x[13]
        self.gyro_bias[2] += delta_x[14]

        # Joseph form / stabilized covariance update: P = (I - K*H)*P
        # P_new = P - K * (H * P)
        hp = [0.0]*15
        for j in range(15):
            s = 0.0
            for i in range(15):
                s += h[i] * self.P[i][j]
            hp[j] = s

        for i in range(15):
            ki = k[i]
            if ki != 0.0:
                for j in range(15):
                    self.P[i][j] -= ki * hp[j]

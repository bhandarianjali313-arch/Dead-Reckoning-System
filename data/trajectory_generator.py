"""
High-Fidelity Vehicular Trajectory and Sensor Data Generator.
Generates realistic ground-truth kinematics and synthetic smartphone IMU/GNSS streams:
- Highway segments, city street curves, 90-degree intersections.
- Stop-and-go traffic lights (triggers ZUPT & backward RTS smoother).
- 1.5 km Tunnel section with complete GNSS blackout.
- Road bumps, potholes, and engine vibration.
- Realistic phone misalignment (arbitrary mounting angle).
"""

import math
import random
from typing import Dict, List, Optional, Tuple
from core.types import SensorFrame, GNSSData, CameraFlowData
from core.coordinate_transforms import enu_to_geodetic


class TrajectoryGenerator:
    def __init__(self,
                 scenario: str = "mumbai_tunnel",
                 ref_lat: Optional[float] = None,
                 ref_lon: Optional[float] = None,
                 ref_alt: Optional[float] = None,
                 sample_rate_hz: float = 50.0,
                 seed: int = 42):
        self.scenario = scenario
        if ref_lat is not None and ref_lon is not None:
            self.ref_lat = ref_lat
            self.ref_lon = ref_lon
            self.ref_alt = ref_alt or 25.0
        elif scenario == "lucknow_bbd":
            self.ref_lat = 26.8890
            self.ref_lon = 81.0560
            self.ref_alt = 120.0
        elif scenario == "delhi_tunnel":
            self.ref_lat = 28.6129
            self.ref_lon = 77.2295
            self.ref_alt = 215.0
        elif scenario == "atal_tunnel":
            self.ref_lat = 32.3630
            self.ref_lon = 77.1420
            self.ref_alt = 3060.0
        elif scenario == "bengaluru_airport":
            self.ref_lat = 13.1986
            self.ref_lon = 77.7066
            self.ref_alt = 915.0
        elif scenario == "pune_mumbai_expressway":
            self.ref_lat = 18.7562
            self.ref_lon = 73.3421
            self.ref_alt = 580.0
        elif scenario == "kashmir_chenani":
            self.ref_lat = 33.0450
            self.ref_lon = 75.2850
            self.ref_alt = 1200.0
        elif scenario == "san_francisco":
            self.ref_lat = 37.7749
            self.ref_lon = -122.4194
            self.ref_alt = 25.0
        else: # mumbai_tunnel (default India scenario)
            self.ref_lat = 18.9438
            self.ref_lon = 72.8232
            self.ref_alt = 10.0

        self.sample_rate_hz = sample_rate_hz
        self.dt = 1.0 / sample_rate_hz
        random.seed(seed)

        # Phone mounting orientation in vehicle frame:
        # e.g., phone mounted on car dashboard at pitch = 25 deg, roll = 10 deg, yaw = -15 deg
        self.phone_pitch_deg = 25.0
        self.phone_roll_deg = 10.0
        self.phone_yaw_deg = -15.0
        self._init_phone_rotation()

        # Realistic IMU noise and bias characteristics (MEMS smartphone class)
        self.accel_bias = [0.04, -0.03, 0.05]          # m/s^2
        self.gyro_bias = [0.005, -0.004, 0.008]         # rad/s
        self.accel_noise_std = 0.08                     # m/s^2 / sqrt(Hz)
        self.gyro_noise_std = 0.008                     # rad/s / sqrt(Hz)

    def _init_phone_rotation(self):
        """Precompute rotation matrix R_veh_to_phone."""
        cp = math.cos(math.radians(self.phone_pitch_deg))
        sp = math.sin(math.radians(self.phone_pitch_deg))
        cr = math.cos(math.radians(self.phone_roll_deg))
        sr = math.sin(math.radians(self.phone_roll_deg))
        cy = math.cos(math.radians(self.phone_yaw_deg))
        sy = math.sin(math.radians(self.phone_yaw_deg))

        # Vehicle to Phone rotation matrix
        # (Transpose / inverse of phone-to-vehicle)
        self.R_veh_to_phone = [
            [ cy*cp,               sy*cp,              -sp ],
            [ cy*sp*sr - sy*cr,    sy*sp*sr + cy*cr,    cp*sr ],
            [ cy*sp*cr + sy*sr,    sy*sp*cr - cy*sr,    cp*cr ]
        ]

    def _veh_to_phone(self, v_veh: List[float]) -> List[float]:
        R = self.R_veh_to_phone
        return [
            R[0][0]*v_veh[0] + R[0][1]*v_veh[1] + R[0][2]*v_veh[2],
            R[1][0]*v_veh[0] + R[1][1]*v_veh[1] + R[1][2]*v_veh[2],
            R[2][0]*v_veh[0] + R[2][1]*v_veh[1] + R[2][2]*v_veh[2]
        ]

    def generate_full_test_drive(self, duration_sec: float = 240.0) -> Tuple[List[SensorFrame], List[Dict]]:
        """
        Generates a 4-minute simulated vehicular drive:
        - 0s - 25s: Initial stationary & forward acceleration (alignment phase).
        - 25s - 50s: City driving with smooth turns.
        - 50s - 70s: STOP at red light (tests Feature 2: ZUPT & Stop-based retro-correction).
        - 70s - 100s: Acceleration and entry onto highway.
        - 100s - 175s: 1.5 km TUNNEL with 0% GNSS availability (tests Features 1, 3, 4, 5, 6).
          - Inside tunnel at t=125s: Potholes / road bumps (tests Feature 1: Dynamic Q).
          - Inside tunnel at t=140s: Phone picked up / handled (tests Feature 3: AI Fallback).
        - 175s - 195s: TUNNEL EXIT: GNSS re-acquisition (tests Feature 4: Seamless switching).
        - 195s - 240s: Final suburban cruise and destination stop.
        """
        frames: List[SensorFrame] = []
        ground_truth: List[Dict] = []

        total_steps = int(duration_sec * self.sample_rate_hz)

        # Vehicle state in ENU:
        e, n, u = 0.0, 0.0, 0.0
        v_forward = 0.0                 # Forward speed along vehicle heading
        yaw_rad = 0.0                   # 0 = North, pi/2 = East
        pitch_rad = 0.0
        roll_rad = 0.0

        for step in range(total_steps):
            t = step * self.dt

            # -------------------------------------------------------------
            # Driving Kinematic Profile
            # -------------------------------------------------------------
            target_speed = 0.0
            yaw_rate = 0.0
            is_tunnel = (100.0 <= t <= 175.0)
            is_stopped = False
            bump_vertical_accel = 0.0
            phone_handling_active = False

            if t < 5.0:
                # Stationary warm-up
                target_speed = 0.0
                is_stopped = True
            elif 5.0 <= t < 25.0:
                # Accelerate to city speed (12 m/s ~ 43 km/h)
                target_speed = 12.0
            elif 25.0 <= t < 35.0:
                # 90-degree right turn
                target_speed = 8.0
                yaw_rate = (math.pi / 2.0) / 10.0 # 9 deg/sec
            elif 35.0 <= t < 50.0:
                # Straight city cruise then brake for red light
                target_speed = 10.0 if t < 42.0 else 0.0
            elif 50.0 <= t < 70.0:
                # STOPPED at traffic light
                target_speed = 0.0
                is_stopped = True
            elif 70.0 <= t < 100.0:
                # Accelerate toward highway & tunnel (22 m/s ~ 80 km/h)
                target_speed = 22.0
            elif 100.0 <= t < 175.0:
                # INSIDE TUNNEL (highway cruise at 20 m/s ~ 72 km/h)
                target_speed = 20.0
                # Slight curve in tunnel at t=120 to 135
                if 120.0 <= t < 135.0:
                    yaw_rate = 0.02

                # Road bump / pothole at t=125.0 to 127.0
                if 125.0 <= t <= 127.0:
                    bump_vertical_accel = 3.5 * math.sin(2.0 * math.pi * 8.0 * (t - 125.0))

                # Phone handling anomaly at t=140.0 to 143.0
                if 140.0 <= t <= 143.0:
                    phone_handling_active = True
            elif 175.0 <= t < 195.0:
                # Tunnel exit & speed reduction
                target_speed = 15.0
            else:
                # Final stretch and parking
                target_speed = 10.0 if t < 225.0 else 0.0
                if t >= 225.0:
                    is_stopped = True

            # Longitudinal speed dynamics
            if v_forward < target_speed:
                a_long = min(1.8, (target_speed - v_forward) / 2.0)
            elif v_forward > target_speed:
                a_long = max(-2.5, (target_speed - v_forward) / 1.5)
            else:
                a_long = 0.0

            if is_stopped:
                v_forward = 0.0
                a_long = 0.0
            else:
                v_forward = max(0.0, v_forward + a_long * self.dt)

            # Update orientation and position in ENU
            yaw_rad = (yaw_rad + yaw_rate * self.dt) % (2.0 * math.pi)

            # In ENU: Forward velocity along heading yaw
            # yaw = 0 -> North, yaw = pi/2 -> East
            ve = v_forward * math.sin(yaw_rad)
            vn = v_forward * math.cos(yaw_rad)
            vu = 0.0

            e += ve * self.dt
            n += vn * self.dt
            u += vu * self.dt

            # Convert to Geodetic
            lat, lon, alt = enu_to_geodetic(e, n, u, self.ref_lat, self.ref_lon, self.ref_alt)

            # Record Ground Truth
            gt_record = {
                "t": t,
                "e": e,
                "n": n,
                "u": u,
                "lat": lat,
                "lon": lon,
                "alt": alt,
                "v_forward": v_forward,
                "a_forward": a_long,
                "yaw_rate": yaw_rate,
                "ve": ve,
                "vn": vn,
                "yaw_deg": math.degrees(yaw_rad),
                "is_tunnel": is_tunnel,
                "is_stopped": is_stopped,
                "pothole": (125.0 <= t <= 127.0),
                "phone_handled": phone_handling_active
            }
            ground_truth.append(gt_record)

            # -------------------------------------------------------------
            # Construct Vehicle-Frame Specific Force & Angular Rate
            # -------------------------------------------------------------
            # Vehicle frame: X: Forward, Y: Right, Z: Down
            # Reaction force: Up is -Z in vehicle frame, so +9.81 on Z_body
            a_centrifugal = v_forward * yaw_rate # Lateral acceleration in Y
            a_veh = [
                a_long,
                a_centrifugal,
                -9.80665 - bump_vertical_accel
            ]
            w_veh = [
                0.0,
                0.0,
                yaw_rate # Yaw rate in Z
            ]

            # Add road micro-vibrations if vehicle is moving
            if v_forward > 0.5:
                vib = 0.12 * math.sin(2.0 * math.pi * 22.0 * t)
                a_veh[2] += vib

            # -------------------------------------------------------------
            # Transform to Phone Coordinate Frame
            # -------------------------------------------------------------
            a_phone = self._veh_to_phone(a_veh)
            w_phone = self._veh_to_phone(w_veh)

            # Inject Phone Handling Disturbance if triggered
            if phone_handling_active:
                # Sudden rotational shaking & jerk as user lifts phone
                w_phone[0] += 2.8 * math.sin(6.0 * (t - 140.0))
                w_phone[1] += 2.2 * math.cos(5.0 * (t - 140.0))
                w_phone[2] += 1.5 * math.sin(7.0 * (t - 140.0))
                a_phone[0] += 5.0 * math.sin(10.0 * (t - 140.0))
                a_phone[1] += 4.0 * math.cos(9.0 * (t - 140.0))

            # Add sensor biases & Gaussian noise
            a_meas = [
                a_phone[0] + self.accel_bias[0] + random.gauss(0, self.accel_noise_std),
                a_phone[1] + self.accel_bias[1] + random.gauss(0, self.accel_noise_std),
                a_phone[2] + self.accel_bias[2] + random.gauss(0, self.accel_noise_std)
            ]
            w_meas = [
                w_phone[0] + self.gyro_bias[0] + random.gauss(0, self.gyro_noise_std),
                w_phone[1] + self.gyro_bias[1] + random.gauss(0, self.gyro_noise_std),
                w_phone[2] + self.gyro_bias[2] + random.gauss(0, self.gyro_noise_std)
            ]
            mag_meas = [22.0, 5.0, 42.0] # Earth magnetic field vector in uT

            # -------------------------------------------------------------
            # GNSS Data (1 Hz rate, completely blocked during tunnel)
            # -------------------------------------------------------------
            gnss_data = None
            if step % int(self.sample_rate_hz) == 0: # 1 Hz
                if is_tunnel:
                    # Tunnel blackout!
                    gnss_data = GNSSData(
                        timestamp=t,
                        lat=lat,
                        lon=lon,
                        alt=alt,
                        speed_mps=0.0,
                        bearing_deg=0.0,
                        horizontal_accuracy_m=999.0,
                        num_satellites=0,
                        is_valid=False
                    )
                else:
                    # Normal GNSS with realistic multi-path and white noise (1.5m 1-sigma)
                    noise_e = random.gauss(0, 1.2)
                    noise_n = random.gauss(0, 1.2)
                    gnss_lat, gnss_lon, gnss_alt = enu_to_geodetic(
                        e + noise_e, n + noise_n, u,
                        self.ref_lat, self.ref_lon, self.ref_alt
                    )
                    gnss_data = GNSSData(
                        timestamp=t,
                        lat=gnss_lat,
                        lon=gnss_lon,
                        alt=gnss_alt,
                        speed_mps=max(0.0, v_forward + random.gauss(0, 0.2)),
                        bearing_deg=math.degrees(yaw_rad) + random.gauss(0, 1.5),
                        horizontal_accuracy_m=2.2,
                        num_satellites=14,
                        is_valid=True
                    )

            # -------------------------------------------------------------
            # Optional Camera Visual Odometry Flow (10 Hz)
            # -------------------------------------------------------------
            cam_data = None
            if step % int(self.sample_rate_hz / 10.0) == 0:
                # Monocular optical flow speed: proportional to forward velocity
                cam_data = CameraFlowData(
                    timestamp=t,
                    dx_pixels=0.0,
                    dy_pixels=-v_forward * 12.5,
                    dt=0.1,
                    estimated_speed_mps=max(0.0, v_forward + random.gauss(0, 0.35)),
                    is_valid=True
                )

            frames.append(SensorFrame(
                timestamp=t,
                accel=a_meas,
                gyro=w_meas,
                mag=mag_meas,
                gnss=gnss_data,
                camera_flow=cam_data
            ))

        return frames, ground_truth

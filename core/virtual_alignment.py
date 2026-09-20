"""
Automatic Phone-to-Vehicle Virtual Alignment Module.
Enables dead reckoning regardless of phone placement (cup holder, dashboard mount, seat, pocket).
Discovers the orientation rotation matrix R_phone_to_vehicle automatically using:
1. Gravity vector estimation for vertical alignment (Roll/Pitch).
2. Longitudinal acceleration & GNSS velocity correlation for forward axis discovery (Yaw/Azimuth).
3. Continuous anomaly monitoring to trigger re-alignment upon phone relocation.
"""

import math
from typing import List, Optional, Tuple
from core.matrix_math import (
    Mat, vec3_cross, vec3_dot, vec3_normalize, vec3_norm
)


class PhoneVirtualAligner:
    def __init__(self, sample_rate_hz: float = 50.0):
        self.sample_rate_hz = sample_rate_hz
        self.is_aligned = False
        self.alignment_confidence = 0.0

        # Calibration buffers
        self._static_accel_samples: List[List[float]] = []
        self._dynamic_accel_samples: List[Tuple[List[float], float]] = [] # (accel_phone, dv_gnss)

        # Orthonormal basis vectors of the vehicle frame expressed in phone coordinates:
        # x_body (forward), y_body (right), z_body (down)
        self.x_body: List[float] = [1.0, 0.0, 0.0]
        self.y_body: List[float] = [0.0, 1.0, 0.0]
        self.z_body: List[float] = [0.0, 0.0, 1.0]

        # 3x3 Rotation matrix R_{phone -> vehicle}
        self.R_phone_to_veh = Mat.eye(3)

        # Phone handling disturbance detector
        self._prev_accel: Optional[List[float]] = None
        self._jerk_energy_buffer: List[float] = []

    def feed_stationary_imu(self, accel: List[float], gyro: List[float]):
        """Feed IMU data during low-speed or stationary periods to lock gravity vector."""
        gyro_norm = vec3_norm(gyro)
        accel_norm = vec3_norm(accel)

        # Only accept samples when phone is not experiencing chaotic rotation
        if gyro_norm < 0.15 and 8.0 < accel_norm < 11.5:
            self._static_accel_samples.append(accel[:])
            if len(self._static_accel_samples) > 200:
                self._static_accel_samples.pop(0)

        # Update vertical axis z_body if sufficient static samples exist
        if len(self._static_accel_samples) >= 30:
            avg_a = [0.0, 0.0, 0.0]
            for s in self._static_accel_samples:
                avg_a[0] += s[0]
                avg_a[1] += s[1]
                avg_a[2] += s[2]
            n = len(self._static_accel_samples)
            avg_a = [avg_a[0]/n, avg_a[1]/n, avg_a[2]/n]

            # In phone frame, specific force points UP opposite to gravity.
            # Vehicle Down (Z_body) points along gravity direction (-a_measured).
            # If vehicle Up is +Z in ENU, Vehicle Down is -a_measured / norm.
            self.z_body = vec3_normalize([-avg_a[0], -avg_a[1], -avg_a[2]])
            self.alignment_confidence = max(self.alignment_confidence, 0.4)

    def feed_dynamic_imu(self, accel: List[float], gnss_speed_mps: float, gnss_valid: bool):
        """
        Feed IMU during longitudinal acceleration / braking events.
        Correlates horizontal acceleration with rate of change of GNSS speed.
        """
        if not self.is_aligned and len(self._static_accel_samples) >= 30:
            # We already have z_body (vertical). Project accel onto the horizontal plane.
            # a_horiz = a - (a . z_body) * z_body
            az = vec3_dot(accel, self.z_body)
            a_horiz = [
                accel[0] - az * self.z_body[0],
                accel[1] - az * self.z_body[1],
                accel[2] - az * self.z_body[2]
            ]
            horiz_mag = vec3_norm(a_horiz)

            # Look for significant acceleration or braking (> 0.6 m/s^2)
            if horiz_mag > 0.6:
                self._dynamic_accel_samples.append((a_horiz, gnss_speed_mps))
                if len(self._dynamic_accel_samples) > 100:
                    self._dynamic_accel_samples.pop(0)

            # Solve for forward axis x_body once we have enough dynamic samples
            if len(self._dynamic_accel_samples) >= 20:
                self._solve_alignment()

    def _solve_alignment(self):
        """Perform Gram-Schmidt orthonormalization to construct R_phone_to_vehicle."""
        # Average the horizontal acceleration vectors during positive acceleration
        sum_fwd = [0.0, 0.0, 0.0]
        count = 0
        for i in range(1, len(self._dynamic_accel_samples)):
            a_h, v_curr = self._dynamic_accel_samples[i]
            _, v_prev = self._dynamic_accel_samples[i - 1]
            dv = v_curr - v_prev

            # If vehicle was accelerating forward, a_horiz points forward
            if dv >= 0.0:
                sum_fwd[0] += a_h[0]
                sum_fwd[1] += a_h[1]
                sum_fwd[2] += a_h[2]
                count += 1
            else: # Braking: a_horiz points backward, so negate it
                sum_fwd[0] -= a_h[0]
                sum_fwd[1] -= a_h[1]
                sum_fwd[2] -= a_h[2]
                count += 1

        if count == 0:
            return

        fwd_cand = vec3_normalize([sum_fwd[0]/count, sum_fwd[1]/count, sum_fwd[2]/count])

        # Gram-Schmidt: ensure x_body is strictly perpendicular to z_body
        dot_xz = vec3_dot(fwd_cand, self.z_body)
        self.x_body = vec3_normalize([
            fwd_cand[0] - dot_xz * self.z_body[0],
            fwd_cand[1] - dot_xz * self.z_body[1],
            fwd_cand[2] - dot_xz * self.z_body[2]
        ])

        # Lateral axis y_body = z_body x x_body (right-handed frame: X=Fwd, Y=Right, Z=Down)
        self.y_body = vec3_cross(self.z_body, self.x_body)

        # Build Rotation matrix R whose rows are vehicle basis vectors in phone frame
        self.R_phone_to_veh = Mat([
            [self.x_body[0], self.x_body[1], self.x_body[2]],
            [self.y_body[0], self.y_body[1], self.y_body[2]],
            [self.z_body[0], self.z_body[1], self.z_body[2]]
        ])

        self.is_aligned = True
        self.alignment_confidence = 0.98

    def force_preset_alignment(self, pitch_deg: float, roll_deg: float, yaw_deg: float = 0.0):
        """Directly set mounting orientation if known (e.g. phone mounted upright on windshield)."""
        cp = math.cos(math.radians(pitch_deg))
        sp = math.sin(math.radians(pitch_deg))
        cr = math.cos(math.radians(roll_deg))
        sr = math.sin(math.radians(roll_deg))
        cy = math.cos(math.radians(yaw_deg))
        sy = math.sin(math.radians(yaw_deg))

        # Rotation matrix from vehicle to phone frame
        # We need R_phone_to_veh which is the transpose of R_veh_to_phone
        r11 = cy*cp
        r12 = cy*sp*sr - sy*cr
        r13 = cy*sp*cr + sy*sr

        r21 = sy*cp
        r22 = sy*sp*sr + cy*cr
        r23 = sy*sp*cr - cy*sr

        r31 = -sp
        r32 = cp*sr
        r33 = cp*cr

        # R_phone_to_veh is Transpose(R_veh_to_phone)
        self.R_phone_to_veh = Mat([
            [r11, r21, r31],
            [r12, r22, r32],
            [r13, r23, r33]
        ])
        self.x_body = [r11, r21, r31]
        self.y_body = [r12, r22, r32]
        self.z_body = [r13, r23, r33]
        self.is_aligned = True
        self.alignment_confidence = 1.0

    def check_phone_handling_disturbance(self, accel: List[float], gyro: List[float]) -> bool:
        """
        Detects if phone was suddenly lifted, dropped, or adjusted in holder.
        Triggers AI fallback and requests re-alignment if severe.
        """
        if self._prev_accel is None:
            self._prev_accel = accel[:]
            return False

        jerk = [
            (accel[0] - self._prev_accel[0]) * self.sample_rate_hz,
            (accel[1] - self._prev_accel[1]) * self.sample_rate_hz,
            (accel[2] - self._prev_accel[2]) * self.sample_rate_hz
        ]
        self._prev_accel = accel[:]
        jerk_norm = vec3_norm(jerk)
        gyro_norm = vec3_norm(gyro)

        # Unnatural phone handling: rotational rate > 1.8 rad/s accompanied by sudden jerk > 25 m/s^3
        is_handling = (gyro_norm > 1.8 and jerk_norm > 25.0) or (gyro_norm > 3.0)
        return is_handling

    def transform_vector(self, v_phone: List[float]) -> List[float]:
        """Transforms a 3D vector (accel or gyro) from phone frame to vehicle body frame."""
        if not self.is_aligned:
            return v_phone[:]
        R = self.R_phone_to_veh
        return [
            R[0][0]*v_phone[0] + R[0][1]*v_phone[1] + R[0][2]*v_phone[2],
            R[1][0]*v_phone[0] + R[1][1]*v_phone[1] + R[1][2]*v_phone[2],
            R[2][0]*v_phone[0] + R[2][1]*v_phone[1] + R[2][2]*v_phone[2]
        ]

"""
Feature 1: Dynamic Process-Noise Adaptation.
Dynamically scales the filter's process noise covariance Q based on road conditions:
- Smooth asphalt highway -> Lower uncertainty (relies on IMU strapdown integration).
- Bumps, potholes, sharp turns -> Higher uncertainty (avoids vibration corruption, relies on constraints).
"""

from typing import List
from core.matrix_math import Mat


class DynamicNoiseAdapter:
    def __init__(self,
                 base_accel_noise: float = 0.08,
                 base_gyro_noise: float = 0.008,
                 base_accel_bias_noise: float = 1e-4,
                 base_gyro_bias_noise: float = 1e-5):
        self.base_accel_noise = base_accel_noise
        self.base_gyro_noise = base_gyro_noise
        self.base_accel_bias_noise = base_accel_bias_noise
        self.base_gyro_bias_noise = base_gyro_bias_noise

        self.current_q_scale: float = 1.0

    def compute_adapted_q(self, dt: float, ai_q_scale: float) -> Mat:
        """
        Computes the 15x15 process noise covariance matrix Q_k, scaled by AI characterization.
        """
        self.current_q_scale = max(0.1, min(10.0, ai_q_scale))

        # Scale continuous noise densities by the AI dynamic scale
        s = self.current_q_scale
        var_pos = (0.5 * (self.base_accel_noise * s) * dt * dt) ** 2
        var_vel = ((self.base_accel_noise * s) * dt) ** 2
        var_att = ((self.base_gyro_noise * s) * dt) ** 2
        var_ba = (self.base_accel_bias_noise * dt) ** 2
        var_bg = (self.base_gyro_bias_noise * dt) ** 2

        # Diagonal elements of the 15-state error vector:
        # [delta_p (3), delta_v (3), delta_theta (3), delta_ba (3), delta_bg (3)]
        q_diag = [
            var_pos, var_pos, var_pos,
            var_vel, var_vel, var_vel,
            var_att, var_att, var_att,
            var_ba,  var_ba,  var_ba,
            var_bg,  var_bg,  var_bg
        ]
        return Mat.diag(q_diag)

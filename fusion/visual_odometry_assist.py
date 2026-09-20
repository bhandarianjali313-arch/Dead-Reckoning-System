"""
Feature 6: Optional Camera Assistance.
Processes smartphone camera optical flow and visual odometry data:
- Estimates relative forward ground speed from downward or forward scene feature tracks.
- Injects visual velocity pseudomeasurements into the filter to tightly bound
  inertial drift during extended GNSS outages.
"""

import math
from typing import List, Optional, Tuple
from core.types import CameraFlowData


class VisualOdometryAssist:
    def __init__(self,
                 focal_length_px: float = 800.0,
                 camera_height_m: float = 1.2,
                 meas_noise_std_mps: float = 0.4):
        self.focal_length = focal_length_px
        self.camera_height = camera_height_m
        self.meas_noise_std = meas_noise_std_mps
        self.is_enabled: bool = True
        self.total_frames_processed: int = 0

    def compute_visual_update(self,
                              flow: Optional[CameraFlowData],
                              estimated_fwd_speed: float) -> Optional[Tuple[float, float]]:
        """
        Computes forward speed observation from camera optical flow.
        Returns:
            (speed_measurement, measurement_variance) or None
        """
        if not self.is_enabled or flow is None or not flow.is_valid:
            return None

        # Speed measurement from camera
        v_cam = flow.estimated_speed_mps
        if v_cam < 0.0 or v_cam > 60.0:
            return None # Outlier rejection

        r_var = self.meas_noise_std ** 2
        self.total_frames_processed += 1
        return v_cam, r_var

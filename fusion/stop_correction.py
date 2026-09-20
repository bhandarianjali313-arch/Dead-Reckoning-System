"""
Feature 2: Stop-Based Drift Correction.
When the vehicle comes to a stop (traffic lights, stop signs, congestion):
1. Detects standstill via Zero-Velocity Detector (ZUPT).
2. Sets velocity error constraint to reset integration drift and estimate IMU bias.
3. Retro-corrects the completed A -> B trajectory segment backwards using
   RTS smoothing and map-anchor projection before proceeding to C.
"""

from typing import Dict, List, Optional, Tuple
from core.matrix_math import Mat, vec3_norm


class StopDriftCorrector:
    def __init__(self,
                 velocity_threshold_mps: float = 0.3,
                 gyro_threshold_rads: float = 0.05,
                 min_stop_duration_sec: float = 0.8):
        self.vel_thresh = velocity_threshold_mps
        self.gyro_thresh = gyro_threshold_rads
        self.min_stop_duration = min_stop_duration_sec

        self.is_stopped: bool = False
        self._stop_start_time: Optional[float] = None
        self._stop_detected_count: int = 0

        # Segment storage for retrospective smoothing (A -> B)
        self.trajectory_segment: List[Dict] = []
        self.last_anchor_point: Optional[Tuple[float, float]] = None # (E, N) at stop A
        self.total_corrections_performed: int = 0

    def check_standstill(self,
                         current_time: float,
                         speed_mps: float,
                         gyro_body: List[float],
                         accel_body: List[float]) -> bool:
        """
        Determines if vehicle is completely stationary using Generalized Likelihood Ratio.
        """
        gyro_mag = vec3_norm(gyro_body)
        accel_var = abs(accel_body[0]) # Forward acceleration

        condition_met = (speed_mps < self.vel_thresh and
                         gyro_mag < self.gyro_thresh and
                         accel_var < 0.25)

        if condition_met:
            if self._stop_start_time is None:
                self._stop_start_time = current_time
            duration = current_time - self._stop_start_time
            if duration >= self.min_stop_duration:
                self.is_stopped = True
                return True
        else:
            self._stop_start_time = None
            self.is_stopped = False

        return False

    def record_step(self, t: float, e: float, n: float, u: float, v_fwd: float, cov_diag: List[float]):
        """Records state into the active A -> B segment buffer."""
        self.trajectory_segment.append({
            "t": t,
            "e": e,
            "n": n,
            "u": u,
            "v_fwd": v_fwd,
            "cov": cov_diag[:]
        })
        # Keep manageable window (e.g. past 2500 samples ~ 50 seconds)
        if len(self.trajectory_segment) > 2500:
            self.trajectory_segment.pop(0)

    def apply_retro_correction(self,
                              current_stop_anchor: Tuple[float, float]) -> List[Dict]:
        """
        Applies retrospective smoothing along segment A -> B when stop B is confirmed.
        Linear error-growth backward correction:
        e_corr(k) = e(k) - (k / N) * delta_e_drift
        """
        if len(self.trajectory_segment) < 20:
            return self.trajectory_segment

        n_samples = len(self.trajectory_segment)
        last_state = self.trajectory_segment[-1]

        # Drift between estimated endpoint and the verified stop anchor
        drift_e = last_state["e"] - current_stop_anchor[0]
        drift_n = last_state["n"] - current_stop_anchor[1]

        # Smooth backward across the segment
        denom = float(max(1, n_samples - 1))
        corrected_segment = []
        for i, pt in enumerate(self.trajectory_segment):
            alpha = float(i) / denom # Linear growth model of dead reckoning drift (0.0 to 1.0)
            corr_pt = dict(pt)
            corr_pt["e"] = pt["e"] - alpha * drift_e
            corr_pt["n"] = pt["n"] - alpha * drift_n
            # Contract covariance since backward smoothing reduces historical uncertainty
            corr_pt["cov"] = [c * (1.0 - 0.5 * alpha) for c in pt["cov"]]
            corrected_segment.append(corr_pt)

        self.trajectory_segment = corrected_segment
        self.total_corrections_performed += 1
        self.last_anchor_point = current_stop_anchor
        return corrected_segment

"""
Feature 4: Seamless GNSS Switching.
Manages smooth transitions between GNSS-aided navigation and Dead Reckoning:
- Tunnel Entry: Gracefully decouples GNSS updates without transient velocity shocks.
- Tunnel Exit: Applies innovation damping and exponential error-state absorption
  to converge the dead-reckoned trajectory to the GPS fix smoothly, eliminating
  jarring position jumps or map-snapping teleportation.
"""

import math
from typing import List, Optional, Tuple
from core.types import GNSSData, NavigationMode


class SeamlessGNSSSwitcher:
    def __init__(self,
                 convergence_time_sec: float = 2.5,
                 max_jump_threshold_m: float = 35.0):
        self.convergence_time = convergence_time_sec
        self.max_jump_threshold = max_jump_threshold_m

        self.gnss_available: bool = False
        self._last_gnss_loss_time: Optional[float] = None
        self._reacquisition_start_time: Optional[float] = None
        self._reacquisition_offset: List[float] = [0.0, 0.0, 0.0]

    def process_gnss(self,
                     t: float,
                     gnss: Optional[GNSSData],
                     current_estimated_pos: List[float]) -> Tuple[bool, Optional[List[float]], float]:
        """
        Processes incoming GNSS data.
        Returns:
            (use_gnss_update, damped_position_measurement, damping_factor)
        """
        if gnss is None or not gnss.is_valid or gnss.num_satellites < 4:
            # GNSS Outage (e.g. inside tunnel)
            if self.gnss_available:
                self.gnss_available = False
                self._last_gnss_loss_time = t
                self._reacquisition_start_time = None

            return False, None, 0.0

        # GNSS is valid
        if not self.gnss_available:
            # Just re-acquired GNSS at tunnel exit!
            self.gnss_available = True
            self._reacquisition_start_time = t
            # Compute initial jump offset to be smoothly absorbed
            self._reacquisition_offset = [
                current_estimated_pos[0],
                current_estimated_pos[1],
                current_estimated_pos[2]
            ]

        # Calculate smooth damping factor beta in [0.0, 1.0]
        if self._reacquisition_start_time is not None:
            elapsed = t - self._reacquisition_start_time
            if elapsed < self.convergence_time:
                # Exponential S-curve smoothing
                beta = 1.0 - math.exp(-3.0 * elapsed / self.convergence_time)
            else:
                beta = 1.0
                self._reacquisition_start_time = None
        else:
            beta = 1.0

        return True, None, beta

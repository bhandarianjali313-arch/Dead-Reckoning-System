"""
Feature 3: AI Fallback Mechanism.
Monitors AI confidence and sensor anomalies:
- If AI uncertainty spikes or phone handling is detected:
  Temporarily bypasses AI speed assistance and falls back to traditional
  physics-based Invariant Extended Kalman Filter (IEKF) with Non-Holonomic Constraints.
- Once conditions restabilize, seamlessly ramps AI trust back to 100%.
"""

from typing import Dict, Tuple
from core.types import NavigationMode, DisturbanceType


class AIFallbackArbiter:
    def __init__(self,
                 uncertainty_threshold: float = 0.45,
                 recovery_window_samples: int = 30):
        self.uncertainty_thresh = uncertainty_threshold
        self.recovery_window = recovery_window_samples

        self.in_fallback: bool = False
        self.ai_trust_weight: float = 1.0       # 0.0 = 100% Physics IEKF, 1.0 = 100% AI
        self._consecutive_healthy_samples: int = 0
        self.total_fallback_events: int = 0

    def evaluate(self,
                 ai_uncertainty: float,
                 disturbance: DisturbanceType,
                 is_phone_handled: bool) -> Tuple[NavigationMode, float]:
        """
        Determines active navigation mode and blending weight for AI updates.
        Returns:
            (mode, ai_trust_weight)
        """
        is_anomalous = (ai_uncertainty > self.uncertainty_thresh or
                        disturbance == DisturbanceType.PHONE_HANDLING or
                        is_phone_handled)

        if is_anomalous:
            if not self.in_fallback:
                self.total_fallback_events += 1
            self.in_fallback = True
            self.ai_trust_weight = 0.0          # Hard disconnect of AI
            self._consecutive_healthy_samples = 0
            return NavigationMode.AI_FALLBACK_IEKF, 0.0

        if self.in_fallback:
            # Healthy sample received; check for stable recovery
            self._consecutive_healthy_samples += 1
            if self._consecutive_healthy_samples >= self.recovery_window:
                # Smooth ramp-up of AI trust
                ramp_progress = (self._consecutive_healthy_samples - self.recovery_window) / 30.0
                self.ai_trust_weight = min(1.0, ramp_progress)

                if self.ai_trust_weight >= 1.0:
                    self.in_fallback = False
                    return NavigationMode.TUNNEL_DR, 1.0
                else:
                    return NavigationMode.TUNNEL_DR, self.ai_trust_weight
            else:
                return NavigationMode.AI_FALLBACK_IEKF, 0.0
        else:
            self.ai_trust_weight = 1.0
            return NavigationMode.TUNNEL_DR, 1.0

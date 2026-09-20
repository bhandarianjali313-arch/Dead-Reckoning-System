"""
Feature 5: Confidence-Aware Navigation.
Extracts real-time position covariance from the Error-State Kalman Filter to compute:
1. Exact 95% Horizontal Confidence Error Ellipse (semi-major, semi-minor, orientation).
2. Human-readable confidence tier ("HIGH", "MODERATE", "DEGRADED", "CRITICAL").
3. Continuous drift rate estimation in meters per second.
"""

import math
from typing import List
from core.matrix_math import Mat, eigen_2x2
from core.types import ConfidenceMetrics


class ConfidenceTracker:
    # 95% 2D Chi-Square expansion multiplier (sqrt(5.991))
    CHI_95_2D = 2.4477

    def __init__(self):
        self._last_radius: float = 1.0

    def compute_metrics(self, P: Mat, is_gnss_valid: bool, dt: float) -> ConfidenceMetrics:
        """
        Extracts horizontal position covariance from 15x15 P matrix.
        Rows/cols 0: East, 1: North.
        """
        cov_2x2 = [
            [P[0][0], P[0][1]],
            [P[1][0], P[1][1]]
        ]

        lam1, lam2, angle_rad = eigen_2x2(cov_2x2)

        # 95% error ellipse axes in meters
        semi_major = self.CHI_95_2D * math.sqrt(max(0.01, lam1))
        semi_minor = self.CHI_95_2D * math.sqrt(max(0.01, lam2))
        ellipse_angle_deg = math.degrees(angle_rad)

        # Approximate 95% horizontal accuracy radius
        h_acc = (semi_major + semi_minor) * 0.5

        # Determine user-facing confidence tier
        if is_gnss_valid and h_acc < 3.5:
            level = "HIGH"
        elif h_acc < 8.0:
            level = "MODERATE"
        elif h_acc < 22.0:
            level = "DEGRADED"
        else:
            level = "CRITICAL"

        drift_rate = max(0.0, (h_acc - self._last_radius) / max(0.001, dt)) if not is_gnss_valid else 0.0
        self._last_radius = h_acc

        return ConfidenceMetrics(
            horizontal_accuracy_m=round(h_acc, 2),
            semi_major_axis_m=round(semi_major, 2),
            semi_minor_axis_m=round(semi_minor, 2),
            ellipse_angle_deg=round(ellipse_angle_deg, 1),
            confidence_level=level,
            estimated_drift_rate_mps=round(drift_rate, 3)
        )

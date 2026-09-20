"""
Data types and definitions for the AI Dead Reckoning Navigation System.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional, Tuple


class NavigationMode(str, Enum):
    GNSS_AIDED = "GNSS_AIDED"                    # Normal fused operation with high accuracy
    TUNNEL_DR = "TUNNEL_DR"                      # GNSS blackout: AI + IMU Dead Reckoning active
    AI_FALLBACK_IEKF = "AI_FALLBACK_IEKF"        # Abnormal sensor/phone disturbance: physics-only IEKF
    ZUPT_CORRECTED = "ZUPT_CORRECTED"            # Standstill detected: Zero-Velocity & retro-correction applied


class DisturbanceType(str, Enum):
    NORMAL = "NORMAL"
    ROAD_BUMP = "ROAD_BUMP"
    POTHOLE = "POTHOLE"
    SHARP_TURN = "SHARP_TURN"
    PHONE_HANDLING = "PHONE_HANDLING"            # User picked up, shifted, or dropped phone


@dataclass
class GNSSData:
    timestamp: float
    lat: float
    lon: float
    alt: float
    speed_mps: float
    bearing_deg: float
    horizontal_accuracy_m: float
    num_satellites: int
    is_valid: bool = True


@dataclass
class CameraFlowData:
    timestamp: float
    dx_pixels: float
    dy_pixels: float
    dt: float
    estimated_speed_mps: float
    is_valid: bool = False


@dataclass
class SensorFrame:
    timestamp: float
    accel: List[float]                  # [ax, ay, az] in m/s^2 (phone frame)
    gyro: List[float]                   # [gx, gy, gz] in rad/s (phone frame)
    mag: List[float]                    # [mx, my, mz] in uT (phone frame)
    gnss: Optional[GNSSData] = None
    camera_flow: Optional[CameraFlowData] = None


@dataclass
class ConfidenceMetrics:
    horizontal_accuracy_m: float        # 95% confidence radius in meters
    semi_major_axis_m: float            # 95% error ellipse semi-major
    semi_minor_axis_m: float            # 95% error ellipse semi-minor
    ellipse_angle_deg: float            # Orientation of major axis
    confidence_level: str               # "HIGH" (<3m), "MODERATE" (<10m), "DEGRADED" (<25m), "CRITICAL"
    estimated_drift_rate_mps: float


@dataclass
class VehicleState:
    timestamp: float
    # Position in Local ENU (East, North, Up) in meters
    position_enu: List[float]           # [E, N, U]
    # Geodetic coordinates
    lat: float
    lon: float
    alt: float
    # Velocity in ENU in m/s
    velocity_enu: List[float]           # [vE, vN, vU]
    speed_mps: float
    # Attitude
    quat: List[float]                   # [qw, qx, qy, qz]
    roll_deg: float
    pitch_deg: float
    yaw_deg: float                      # Heading in degrees (0 = North, 90 = East)
    # Sensor biases
    accel_bias: List[float]             # [bx, by, bz] in m/s^2
    gyro_bias: List[float]              # [bgx, bgy, bgz] in rad/s
    # Covariance diagonals
    pos_std_m: List[float]              # [std_E, std_N, std_U]
    vel_std_mps: List[float]            # [std_vE, std_vN, std_vU]
    # Mode and confidence
    mode: NavigationMode
    confidence: ConfidenceMetrics
    # AI characterization
    dynamic_q_scale: float = 1.0        # Feature 1: AI-scaled process noise
    detected_disturbance: DisturbanceType = DisturbanceType.NORMAL
    ai_uncertainty_score: float = 0.05  # Lower is better (0.0 to 1.0)

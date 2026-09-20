"""
Geodetic, ECEF, ENU, and Vehicle Body Coordinate Transformations.
Standard WGS-84 reference ellipsoid parameters and vector transformations.
"""

import math
from typing import List, Tuple

# WGS-84 Ellipsoid Constants
WGS84_A = 6378137.0                 # Semi-major axis (meters)
WGS84_F = 1.0 / 298.257223563       # Flattening
WGS84_B = WGS84_A * (1.0 - WGS84_F) # Semi-minor axis (meters)
WGS84_E2 = 2.0 * WGS84_F - WGS84_F**2 # First eccentricity squared


def geodetic_to_ecef(lat_deg: float, lon_deg: float, alt_m: float) -> Tuple[float, float, float]:
    """Convert WGS-84 Geodetic (lat, lon, alt) to Earth-Centered Earth-Fixed (ECEF) [X, Y, Z]."""
    lat = math.radians(lat_deg)
    lon = math.radians(lon_deg)
    sin_lat = math.sin(lat)
    cos_lat = math.cos(lat)
    sin_lon = math.sin(lon)
    cos_lon = math.cos(lon)

    # Prime vertical radius of curvature
    n = WGS84_A / math.sqrt(1.0 - WGS84_E2 * sin_lat * sin_lat)

    x = (n + alt_m) * cos_lat * cos_lon
    y = (n + alt_m) * cos_lat * sin_lon
    z = (n * (1.0 - WGS84_E2) + alt_m) * sin_lat
    return x, y, z


def ecef_to_geodetic(x: float, y: float, z: float) -> Tuple[float, float, float]:
    """Convert ECEF [X, Y, Z] to WGS-84 Geodetic (lat, lon, alt) using Bowring's method."""
    p = math.sqrt(x*x + y*y)
    if p < 1e-6:
        lat = 90.0 if z > 0 else -90.0
        return lat, 0.0, abs(z) - WGS84_B

    # Bowring's closed-form algorithm
    e_prime2 = (WGS84_A*WGS84_A - WGS84_B*WGS84_B) / (WGS84_B*WGS84_B)
    theta = math.atan2(z * WGS84_A, p * WGS84_B)

    lat_rad = math.atan2(
        z + e_prime2 * WGS84_B * (math.sin(theta)**3),
        p - WGS84_E2 * WGS84_A * (math.cos(theta)**3)
    )
    lon_rad = math.atan2(y, x)

    sin_lat = math.sin(lat_rad)
    n = WGS84_A / math.sqrt(1.0 - WGS84_E2 * sin_lat * sin_lat)
    alt_m = p / math.cos(lat_rad) - n

    return math.degrees(lat_rad), math.degrees(lon_rad), alt_m


def geodetic_to_enu(lat_deg: float, lon_deg: float, alt_m: float,
                    ref_lat_deg: float, ref_lon_deg: float, ref_alt_m: float) -> Tuple[float, float, float]:
    """
    Convert (lat, lon, alt) to Local Tangent Plane East-North-Up (ENU) coordinates
    relative to a local anchor point.
    """
    x, y, z = geodetic_to_ecef(lat_deg, lon_deg, alt_m)
    x0, y0, z0 = geodetic_to_ecef(ref_lat_deg, ref_lon_deg, ref_alt_m)

    dx = x - x0
    dy = y - y0
    dz = z - z0

    lat0 = math.radians(ref_lat_deg)
    lon0 = math.radians(ref_lon_deg)
    sin_lat0 = math.sin(lat0)
    cos_lat0 = math.cos(lat0)
    sin_lon0 = math.sin(lon0)
    cos_lon0 = math.cos(lon0)

    e = -sin_lon0 * dx + cos_lon0 * dy
    n = -sin_lat0 * cos_lon0 * dx - sin_lat0 * sin_lon0 * dy + cos_lat0 * dz
    u =  cos_lat0 * cos_lon0 * dx + cos_lat0 * sin_lon0 * dy + sin_lat0 * dz

    return e, n, u


def enu_to_geodetic(e: float, n: float, u: float,
                    ref_lat_deg: float, ref_lon_deg: float, ref_alt_m: float) -> Tuple[float, float, float]:
    """Convert Local East-North-Up (ENU) coordinates back to WGS-84 (lat, lon, alt)."""
    x0, y0, z0 = geodetic_to_ecef(ref_lat_deg, ref_lon_deg, ref_alt_m)

    lat0 = math.radians(ref_lat_deg)
    lon0 = math.radians(ref_lon_deg)
    sin_lat0 = math.sin(lat0)
    cos_lat0 = math.cos(lat0)
    sin_lon0 = math.sin(lon0)
    cos_lon0 = math.cos(lon0)

    dx = -sin_lon0 * e - sin_lat0 * cos_lon0 * n + cos_lat0 * cos_lon0 * u
    dy =  cos_lon0 * e - sin_lat0 * sin_lon0 * n + cos_lat0 * sin_lon0 * u
    dz =  cos_lat0 * n + sin_lat0 * u

    x = x0 + dx
    y = y0 + dy
    z = z0 + dz

    return ecef_to_geodetic(x, y, z)


def vehicle_to_enu_rotation(yaw_rad: float, pitch_rad: float = 0.0, roll_rad: float = 0.0) -> List[List[float]]:
    """
    Rotation matrix from Vehicle Body Frame (X: Forward, Y: Right, Z: Down)
    to Local ENU Frame (East, North, Up).
    Yaw is measured clockwise from True North (0=North, pi/2=East).
    """
    cy = math.cos(yaw_rad)
    sy = math.sin(yaw_rad)

    # In vehicle frame:
    # Forward (X) points along heading -> East = sy, North = cy, Up = 0
    # Right (Y) points 90 deg right -> East = cy, North = -sy, Up = 0
    # Down (Z) points down -> Up = -1
    return [
        [ sy,  cy,  0.0],
        [ cy, -sy,  0.0],
        [ 0.0, 0.0, -1.0]
    ]

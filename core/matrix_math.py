"""
High-Performance Mathematical Engine for Sensor Fusion and Dead Reckoning.
Provides transparent dual-support: uses NumPy if available, with a complete,
robust pure-Python numerical fallback for matrix algebra, Kalman gains,
quaternion kinematics, and covariance eigensolvers.
"""

import math
from typing import List, Tuple, Union

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False


class Mat:
    """Lightweight 2D Matrix wrapper with arithmetic operators."""
    def __init__(self, data: Union[List[List[float]], 'np.ndarray']):
        if HAS_NUMPY and isinstance(data, np.ndarray):
            self.data = data.tolist()
            self.rows = data.shape[0]
            self.cols = data.shape[1] if data.ndim > 1 else 1
        else:
            self.data = [list(row) for row in data]
            self.rows = len(self.data)
            self.cols = len(self.data[0]) if self.rows > 0 else 0

    @classmethod
    def zeros(cls, rows: int, cols: int) -> 'Mat':
        return cls([[0.0] * cols for _ in range(rows)])

    @classmethod
    def eye(cls, n: int) -> 'Mat':
        m = cls.zeros(n, n)
        for i in range(n):
            m.data[i][i] = 1.0
        return m

    @classmethod
    def diag(cls, values: List[float]) -> 'Mat':
        n = len(values)
        m = cls.zeros(n, n)
        for i in range(n):
            m.data[i][i] = float(values[i])
        return m

    def copy(self) -> 'Mat':
        return Mat([row[:] for row in self.data])

    def __getitem__(self, idx):
        return self.data[idx]

    def __setitem__(self, idx, val):
        self.data[idx] = val

    def transpose(self) -> 'Mat':
        out = Mat.zeros(self.cols, self.rows)
        for i in range(self.rows):
            for j in range(self.cols):
                out.data[j][i] = self.data[i][j]
        return out

    @property
    def T(self) -> 'Mat':
        return self.transpose()

    def __add__(self, other: 'Mat') -> 'Mat':
        out = Mat.zeros(self.rows, self.cols)
        for i in range(self.rows):
            for j in range(self.cols):
                out.data[i][j] = self.data[i][j] + other.data[i][j]
        return out

    def __sub__(self, other: 'Mat') -> 'Mat':
        out = Mat.zeros(self.rows, self.cols)
        for i in range(self.rows):
            for j in range(self.cols):
                out.data[i][j] = self.data[i][j] - other.data[i][j]
        return out

    def __mul__(self, other: Union['Mat', float, int]) -> 'Mat':
        if isinstance(other, (int, float)):
            out = Mat.zeros(self.rows, self.cols)
            for i in range(self.rows):
                for j in range(self.cols):
                    out.data[i][j] = self.data[i][j] * float(other)
            return out
        elif isinstance(other, Mat):
            # Matrix multiplication
            assert self.cols == other.rows, f"Dimension mismatch: {self.cols} != {other.rows}"
            out = Mat.zeros(self.rows, other.cols)
            for i in range(self.rows):
                for k in range(self.cols):
                    s = self.data[i][k]
                    if s != 0.0:
                        for j in range(other.cols):
                            out.data[i][j] += s * other.data[k][j]
            return out
        raise TypeError(f"Unsupported operand type for *: Mat and {type(other)}")

    def __rmul__(self, other: Union[float, int]) -> 'Mat':
        return self.__mul__(other)

    def to_list(self) -> List[List[float]]:
        return [row[:] for row in self.data]

    def inv(self) -> 'Mat':
        """Gauss-Jordan matrix inverse with partial pivoting."""
        assert self.rows == self.cols, "Matrix must be square to invert"
        n = self.rows
        # Augmented matrix [A | I]
        aug = [self.data[i][:] + [1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
        
        for col in range(n):
            # Pivot selection
            max_row = col
            max_val = abs(aug[col][col])
            for r in range(col + 1, n):
                if abs(aug[r][col]) > max_val:
                    max_val = abs(aug[r][col])
                    max_row = r
            if max_val < 1e-15:
                # Add tiny regularization to diagonal for singular Kalman covariance robustness
                aug[col][col] += 1e-6
            aug[col], aug[max_row] = aug[max_row], aug[col]

            pivot = aug[col][col]
            inv_p = 1.0 / pivot
            for c in range(2 * n):
                aug[col][c] *= inv_p

            for r in range(n):
                if r != col:
                    factor = aug[r][col]
                    if factor != 0.0:
                        for c in range(2 * n):
                            aug[r][c] -= factor * aug[col][c]

        inv_data = [[aug[i][j + n] for j in range(n)] for i in range(n)]
        return Mat(inv_data)


# ---------------------------------------------------------------------------
# Vector Math Utilities
# ---------------------------------------------------------------------------

def vec3_norm(v: List[float]) -> float:
    return math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2])

def vec3_normalize(v: List[float]) -> List[float]:
    n = vec3_norm(v)
    if n < 1e-12:
        return [0.0, 0.0, 1.0]
    return [v[0]/n, v[1]/n, v[2]/n]

def vec3_cross(a: List[float], b: List[float]) -> List[float]:
    return [
        a[1]*b[2] - a[2]*b[1],
        a[2]*b[0] - a[0]*b[2],
        a[0]*b[1] - a[1]*b[0]
    ]

def vec3_dot(a: List[float], b: List[float]) -> float:
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]

def skew_symmetric(v: List[float]) -> Mat:
    """Skew symmetric cross-product matrix [v]_x."""
    return Mat([
        [0.0,   -v[2],  v[1]],
        [v[2],   0.0,  -v[0]],
        [-v[1],  v[0],  0.0 ]
    ])


# ---------------------------------------------------------------------------
# Quaternion Operations: q = [qw, qx, qy, qz]
# ---------------------------------------------------------------------------

def quat_norm(q: List[float]) -> float:
    return math.sqrt(q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3])

def quat_normalize(q: List[float]) -> List[float]:
    n = quat_norm(q)
    if n < 1e-12:
        return [1.0, 0.0, 0.0, 0.0]
    return [q[0]/n, q[1]/n, q[2]/n, q[3]/n]

def quat_mult(q1: List[float], q2: List[float]) -> List[float]:
    w1, x1, y1, z1 = q1
    w2, x2, y2, z2 = q2
    return [
        w1*w2 - x1*x2 - y1*y2 - z1*z2,
        w1*x2 + x1*w2 + y1*z2 - z1*y2,
        w1*y2 - x1*z2 + y1*w2 + z1*x2,
        w1*z2 + x1*y2 - y1*x2 + z1*w2
    ]

def quat_from_axis_angle(axis: List[float], angle: float) -> List[float]:
    half = angle * 0.5
    s = math.sin(half)
    n_axis = vec3_normalize(axis)
    return [math.cos(half), n_axis[0]*s, n_axis[1]*s, n_axis[2]*s]

def quat_to_dcm(q: List[float]) -> Mat:
    """Convert unit quaternion to 3x3 Direction Cosine Matrix R."""
    w, x, y, z = quat_normalize(q)
    xx, yy, zz = x*x, y*y, z*z
    xy, xz, yz = x*y, x*z, y*z
    wx, wy, wz = w*x, w*y, w*z

    return Mat([
        [1.0 - 2.0*(yy + zz), 2.0*(xy - wz),       2.0*(xz + wy)],
        [2.0*(xy + wz),       1.0 - 2.0*(xx + zz), 2.0*(yz - wx)],
        [2.0*(xz - wy),       2.0*(yz + wx),       1.0 - 2.0*(xx + yy)]
    ])

def quat_to_euler(q: List[float]) -> Tuple[float, float, float]:
    """Extract (roll, pitch, yaw) in radians from quaternion."""
    w, x, y, z = quat_normalize(q)
    # Roll (x-axis rotation)
    sinr_cosp = 2.0 * (w * x + y * z)
    cosr_cosp = 1.0 - 2.0 * (x * x + y * y)
    roll = math.atan2(sinr_cosp, cosr_cosp)

    # Pitch (y-axis rotation)
    sinp = 2.0 * (w * y - z * x)
    if abs(sinp) >= 1.0:
        pitch = math.copysign(math.pi / 2.0, sinp)
    else:
        pitch = math.asin(sinp)

    # Yaw (z-axis rotation)
    siny_cosp = 2.0 * (w * z + x * y)
    cosy_cosp = 1.0 - 2.0 * (y * y + z * z)
    yaw = math.atan2(siny_cosp, cosy_cosp)

    return roll, pitch, yaw

def euler_to_quat(roll: float, pitch: float, yaw: float) -> List[float]:
    cr = math.cos(roll * 0.5)
    sr = math.sin(roll * 0.5)
    cp = math.cos(pitch * 0.5)
    sp = math.sin(pitch * 0.5)
    cy = math.cos(yaw * 0.5)
    sy = math.sin(yaw * 0.5)

    return [
        cr * cp * cy + sr * sp * sy,
        sr * cp * cy - cr * sp * sy,
        cr * sp * cy + sr * cp * sy,
        cr * cp * sy - sr * sp * cy
    ]

def rotate_vec_by_quat(q: List[float], v: List[float]) -> List[float]:
    R = quat_to_dcm(q)
    return [
        R[0][0]*v[0] + R[0][1]*v[1] + R[0][2]*v[2],
        R[1][0]*v[0] + R[1][1]*v[1] + R[1][2]*v[2],
        R[2][0]*v[0] + R[2][1]*v[1] + R[2][2]*v[2]
    ]


# ---------------------------------------------------------------------------
# 2D Covariance Eigen-Decomposition for Confidence Ellipses
# ---------------------------------------------------------------------------

def eigen_2x2(cov: List[List[float]]) -> Tuple[float, float, float]:
    """
    Computes (lambda_major, lambda_minor, orientation_rad) for a 2x2 symmetric
    positive semi-definite matrix [[cxx, cxy], [cyx, cyy]].
    """
    cxx = cov[0][0]
    cxy = cov[0][1]
    cyy = cov[1][1]

    trace = cxx + cyy
    det = cxx * cyy - cxy * cxy
    term = math.sqrt(max(0.0, (cxx - cyy)**2 + 4.0 * cxy**2))

    lam1 = (trace + term) * 0.5
    lam2 = max(0.0, (trace - term) * 0.5)

    if abs(cxy) > 1e-12:
        angle = math.atan2(lam1 - cxx, cxy)
    else:
        angle = 0.0 if cxx >= cyy else (math.pi / 2.0)

    return lam1, lam2, angle

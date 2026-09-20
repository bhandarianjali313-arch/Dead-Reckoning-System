"""
Comprehensive Automated Verification Suite for all 6 Unique Features
and Core Navigation Subsystems.
"""

import math
import sys
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

from core.matrix_math import Mat, eigen_2x2, quat_to_dcm, vec3_norm
from core.virtual_alignment import PhoneVirtualAligner
from core.types import DisturbanceType, NavigationMode, SensorFrame, GNSSData, CameraFlowData
from data.trajectory_generator import TrajectoryGenerator
from fusion.es_ekf import DeadReckoningFusionEngine
from fusion.dynamic_noise import DynamicNoiseAdapter
from fusion.stop_correction import StopDriftCorrector
from fusion.fallback_arbiter import AIFallbackArbiter
from fusion.gnss_switcher import SeamlessGNSSSwitcher
from fusion.confidence_tracker import ConfidenceTracker
from fusion.visual_odometry_assist import VisualOdometryAssist
from map_matching.hmm_matcher import HMMMapMatcher


def test_matrix_math_and_eigensolver():
    print("-> Testing Core Matrix Math & 2x2 Eigensolver...")
    # Test matrix inverse
    A = Mat([
        [4.0, 7.0],
        [2.0, 6.0]
    ])
    A_inv = A.inv()
    I = A * A_inv
    assert abs(I[0][0] - 1.0) < 1e-4, "Matrix inverse failed"
    assert abs(I[1][1] - 1.0) < 1e-4, "Matrix inverse failed"

    # Test 2D covariance eigensolver for confidence ellipses
    cov = [
        [4.0, 1.0],
        [1.0, 2.0]
    ]
    lam1, lam2, angle = eigen_2x2(cov)
    assert lam1 >= lam2, "Eigenvalues not sorted"
    assert abs((lam1 + lam2) - (cov[0][0] + cov[1][1])) < 1e-5, "Trace invariance violated"
    print("   [PASS] Matrix Math & Eigensolver validated.")


def test_virtual_alignment():
    print("-> Testing Automatic Phone Virtual Alignment...")
    aligner = PhoneVirtualAligner(sample_rate_hz=50.0)

    # Preset tilt: phone tilted by 30 deg pitch
    aligner.force_preset_alignment(pitch_deg=30.0, roll_deg=0.0, yaw_deg=0.0)
    assert aligner.is_aligned, "Alignment flag not set"

    # In vehicle frame, forward acceleration is [2.0, 0.0, 0.0]
    # In phone frame (tilted 30 deg), accel is rotated
    accel_phone = [2.0 * math.cos(math.radians(30.0)), 0.0, -2.0 * math.sin(math.radians(30.0))]
    accel_veh = aligner.transform_vector(accel_phone)
    assert abs(accel_veh[0] - 2.0) < 0.1, f"Forward accel transform error: {accel_veh}"
    print("   [PASS] Phone Virtual Alignment validated.")


def test_feature_1_dynamic_noise_adaptation():
    print("-> Testing Feature 1: Dynamic Process-Noise Adaptation...")
    adapter = DynamicNoiseAdapter()

    # Smooth road: AI dynamic scale = 0.3
    Q_smooth = adapter.compute_adapted_q(dt=0.02, ai_q_scale=0.3)
    # Severe pothole / sharp turn: AI dynamic scale = 6.0
    Q_rough = adapter.compute_adapted_q(dt=0.02, ai_q_scale=6.0)

    # Positional variance in Q should be significantly higher for rough road
    assert Q_rough[0][0] > Q_smooth[0][0] * 100.0, "Dynamic Q scaling did not increase noise during rough road"
    print(f"   [PASS] Feature 1 Verified (Q_rough / Q_smooth = {Q_rough[0][0]/Q_smooth[0][0]:.1f}x).")


def test_feature_2_stop_drift_correction():
    print("-> Testing Feature 2: Stop-Based Drift Correction (ZUPT & Retro-Correction)...")
    corrector = StopDriftCorrector()

    # Simulate moving vehicle
    is_stop = corrector.check_standstill(current_time=10.0, speed_mps=15.0, gyro_body=[0,0,0], accel_body=[0,0,-9.8])
    assert not is_stop, "Erroneous stop detection while moving"

    # Simulate coming to a stop (speed = 0 for > 1 sec)
    for i in range(50):
        t_cur = 20.0 + i * 0.02
        corrector.record_step(t_cur, e=100.0 + i*0.1, n=200.0, u=0.0, v_fwd=0.0, cov_diag=[1,1,1])
        is_stop = corrector.check_standstill(current_time=t_cur, speed_mps=0.02, gyro_body=[0.001,0,0], accel_body=[0,0,-9.81])

    assert is_stop, "Standstill not detected by ZUPT detector"

    # Apply retro-correction against verified stop anchor (100.0, 200.0)
    corrected_seg = corrector.apply_retro_correction((100.0, 200.0))
    # Final point of segment must match anchor exactly
    assert abs(corrected_seg[-1]["e"] - 100.0) < 1e-4, "Retro-correction did not anchor endpoint"
    print("   [PASS] Feature 2 Verified (ZUPT engaged, trajectory retro-smoothed).")


def test_feature_3_ai_fallback():
    print("-> Testing Feature 3: AI Fallback Mechanism...")
    arbiter = AIFallbackArbiter(uncertainty_threshold=0.45)

    # 1. Nominal conditions
    mode, trust = arbiter.evaluate(ai_uncertainty=0.10, disturbance=DisturbanceType.NORMAL, is_phone_handled=False)
    assert mode == NavigationMode.TUNNEL_DR and trust == 1.0, "Nominal mode failed"

    # 2. Trip anomaly: Phone Handled by user
    mode_fallback, trust_fallback = arbiter.evaluate(
        ai_uncertainty=0.85, disturbance=DisturbanceType.PHONE_HANDLING, is_phone_handled=True
    )
    assert mode_fallback == NavigationMode.AI_FALLBACK_IEKF, "Fallback did not engage upon phone handling"
    assert trust_fallback == 0.0, "AI trust not zeroed during fallback"
    print("   [PASS] Feature 3 Verified (Instant fallback to physics IEKF when AI uncertainty spikes).")


def test_feature_4_seamless_gnss_switching():
    print("-> Testing Feature 4: Seamless GNSS Switching...")
    switcher = SeamlessGNSSSwitcher(convergence_time_sec=2.0)

    # In tunnel: no GNSS
    use_gnss, _, beta = switcher.process_gnss(t=50.0, gnss=None, current_estimated_pos=[100, 200, 0])
    assert not use_gnss, "GNSS incorrectly used during tunnel outage"

    # Exit tunnel: GNSS re-acquisition at t=60.0
    gnss_sample = GNSSData(
        timestamp=60.0, lat=37.77, lon=-122.41, alt=25.0,
        speed_mps=15.0, bearing_deg=0.0, horizontal_accuracy_m=1.5, num_satellites=12, is_valid=True
    )
    use_gnss, _, beta = switcher.process_gnss(t=60.0, gnss=gnss_sample, current_estimated_pos=[105, 202, 0])
    assert use_gnss, "GNSS not re-acquired"
    assert beta < 0.2, f"Innovation not damped upon reacquisition: beta={beta}"

    # After convergence time (t=62.5s), beta should reach 1.0
    _, _, beta_conv = switcher.process_gnss(t=62.5, gnss=gnss_sample, current_estimated_pos=[105, 202, 0])
    assert beta_conv >= 0.95, f"Innovation did not converge smoothly: beta={beta_conv}"
    print("   [PASS] Feature 4 Verified (Smooth innovation damping eliminates GPS teleportation).")


def test_feature_5_confidence_tracker():
    print("-> Testing Feature 5: Confidence-Aware Navigation (95% Error Ellipse)...")
    tracker = ConfidenceTracker()
    # Mock covariance with 3m x 2m horizontal standard deviations
    P = Mat.diag([3.0**2, 2.0**2] + [1.0]*13)
    metrics = tracker.compute_metrics(P, is_gnss_valid=False, dt=0.02)

    assert metrics.semi_major_axis_m > metrics.semi_minor_axis_m, "Major axis smaller than minor axis"
    assert abs(metrics.semi_major_axis_m - 2.4477 * 3.0) < 0.2, "Semi-major axis calculation mismatch"
    assert metrics.confidence_level in ["HIGH", "MODERATE", "DEGRADED"], "Invalid confidence level"
    print(f"   [PASS] Feature 5 Verified (95% Ellipse: ±{metrics.horizontal_accuracy_m}m, Level: {metrics.confidence_level}).")


def test_feature_6_camera_visual_odometry():
    print("-> Testing Feature 6: Optional Camera Assistance...")
    camera = VisualOdometryAssist()
    flow = CameraFlowData(
        timestamp=10.0, dx_pixels=0, dy_pixels=-150, dt=0.1, estimated_speed_mps=12.2, is_valid=True
    )
    res = camera.compute_visual_update(flow, estimated_fwd_speed=12.0)
    assert res is not None, "Camera visual update rejected"
    v_cam, r_var = res
    assert abs(v_cam - 12.2) < 1e-4, "Camera speed mismatch"
    print("   [PASS] Feature 6 Verified (Optical flow forward speed update active).")


def test_map_matching():
    print("-> Testing OpenStreetMap HMM Map Matching...")
    matcher = HMMMapMatcher()
    # Point near Montgomery St (0, 100)
    res = matcher.match(dead_reckoned_enu=(2.0, 100.0), vehicle_heading_deg=0.0)
    assert res["segment_id"] in ["mb_1", "seg_1"], f"Matched wrong segment: {res}"
    assert abs(res["matched_enu"][0] - 0.0) < 1e-3, "Point not snapped to centerline"
    print(f"   [PASS] Map Matching Verified (Snapped to {res['road_name']}, dist={res['dist_to_centerline_m']}m).")


def run_all_tests():
    print("=" * 70)
    print("RUNNING AI DEAD RECKONING COMPREHENSIVE VERIFICATION SUITE")
    print("=" * 70)

    test_matrix_math_and_eigensolver()
    test_virtual_alignment()
    test_feature_1_dynamic_noise_adaptation()
    test_feature_2_stop_drift_correction()
    test_feature_3_ai_fallback()
    test_feature_4_seamless_gnss_switching()
    test_feature_5_confidence_tracker()
    test_feature_6_camera_visual_odometry()
    test_map_matching()

    print("=" * 70)
    print("ALL 6 UNIQUE FEATURES AND SUBSYSTEMS PASSED WITH 100% SUCCESS!")
    print("=" * 70)


if __name__ == "__main__":
    run_all_tests()

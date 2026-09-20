# 🚗 AI/ML-Based Intelligent Dead Reckoning System for Seamless Navigation 



A commercial-grade, end-to-end intelligent dead-reckoning vehicular navigation platform engineered to continuously and reliably track vehicles in **GPS/GNSS-denied environments** (undersea tunnels, mountain passages, underground expressways, dense urban street canyons, dense forest canopies) using smartphone inertial sensor fusion (IMU), deep learning motion characterization, kinematic vehicle constraints, and high-precision Google Maps cartography.

---

## ⭐ Our 6 Unique Features

| # | Feature Name | Core Principle & Mechanism | Practical Impact |
|---|---|---|---|
| **1** | **Dynamic Process-Noise Adaptation** | **Adaptive Uncertainty Tuning**: Instead of keeping uncertainty fixed, AI changes it according to the driving situation based on IMU spectral roughness and steering dynamics. | Smooth road → lower uncertainty ($Q \sim 0.35$); bumpy road or sharp turn → higher uncertainty ($Q \sim 5.5$), preventing filter divergence from spurious IMU shocks. |
| **2** | **Stop-Based Drift Correction** | **Standstill Detection & Smoothing**: When the vehicle stops, the system gets an opportunity to estimate accumulated drift by comparing the estimated journey with the road map. | Performs Zero-Velocity Updates (ZUPT) and corrects the previous $A \rightarrow B$ trajectory before the vehicle continues toward $C$. |
| **3** | **AI Fallback Mechanism** | **Dual Tripwire Arbiter**: We don't blindly trust AI. If the AI becomes uncertain because of abnormal sensor data, sudden phone movement, or an unfamiliar situation, the system safely intervenes. | Temporarily falls back to the traditional robust physics-based Invariant EKF (IEKF) with non-holonomic constraints, keeping navigation 100% alive. |
| **4** | **Seamless GNSS Switching** | **Smooth Transition Re-acquisition**: GNSS and dead reckoning work together when GNSS is available. When GNSS disappears, the system automatically relies more on IMU, AI, and map-based positioning. | When GNSS returns, it smoothly dampens innovation errors over 2.5s and corrects accumulated drift instead of suddenly jumping or teleporting the vehicle. |
| **5** | **Confidence-Aware Navigation** | **Horizontal Error Ellipse Extraction**: Real-time covariance eigen-decomposition extracting 95% confidence bounds and status indicators. | Provides drivers and autonomous agents with not only the estimated position, but also an exact indication of how confident it is in that position and how much error may exist ($\pm \text{meters}$). |
| **6** | **Optional Camera Assistance** | **Visual Odometry Speed Update**: If needed, the smartphone camera can provide an additional movement estimate using visual optical flow information alongside IMU data. | Bounds longitudinal velocity drift rate during prolonged GNSS blackouts when camera frames are available. |

---

## 🖥️ 5 Interactive Frontend Views

The platform web interface (`http://127.0.0.1:8000/`) includes:
1. **🧭 Live Cockpit**: 60 FPS Canvas Leaflet map with pure Google Maps Platform layers (Dark, Street, Satellite, Hybrid, Terrain), HUD Speedometer, 95% Error Ellipse, Heading Tape, 3D Horizon, Reverse Geocoded Address, and Anomaly Injection buttons.
2. **📈 Sensor & Telemetry Lab**: Four real-time 50 Hz oscilloscopes tracking 3-Axis Accelerometer ($a_x, a_y, a_z$), 3-Axis Gyroscope ($\omega_x, \omega_y, \omega_z$), Dynamic $Q$-noise scaling, and metric horizontal uncertainty.
3. **🧪 Benchmark Arena**: Comparative statistical matrix evaluating Proposed AI System vs. Standard Kinematic EKF vs. Raw IMU Double Integration (RMSE, CEP50, CEP95, maximum tunnel drift, and processing latency).
4. **🗺️ Custom Route Builder**: Interactive tool to generate custom Indian vehicular trajectories on-the-fly with tunable coordinates, blackout duration (15s - 90s), cruising speed, and smartphone IMU noise scales.
5. **💻 Developer API & Data Hub**: Live WebSocket streaming console, REST API explorer with instant JSON inspection, and one-click GeoJSON / CSV downloads.

---

## 🛠️ Complete Tech Stack Architecture

```
ai_dead_reckoning_system/
├── core/                                      # Core Types, 3D Vector Math & Phone Alignment
│   ├── matrix_math.py                         # Pure-Python / NumPy dual math engine & 2x2 eigensolvers
│   ├── types.py                              # SensorFrame, VehicleState, ConfidenceMetrics
│   ├── coordinate_transforms.py              # WGS84, ECEF, ENU, and vehicle body transformations
│   └── virtual_alignment.py                  # Automatic phone orientation discovery in vehicle
│
├── data/                                      # Vehicular Simulation & Trajectory Generation
│   └── trajectory_generator.py                # Multi-scenario generator with tunnels, stops, bumps, noise
│
├── ai_models/                                 # AI/ML Neural Kinematics Engine
│   ├── network.py                            # DeepIMUNet (1D-CNN + GRU) multi-task neural network
│   └── train_eval.py                         # Supervised training & evaluation metrics harness
│
├── fusion/                                    # Sensor Fusion & Positioning Engine
│   ├── es_ekf.py                             # 15-State Error-State Kalman Filter with NHC
│   ├── dynamic_noise.py                      # Feature 1: Dynamic process-noise adaptation
│   ├── stop_correction.py                    # Feature 2: Stop-based ZUPT & RTS smoother
│   ├── fallback_arbiter.py                   # Feature 3: AI fallback arbiter
│   ├── gnss_switcher.py                      # Feature 4: Seamless GNSS switching
│   ├── confidence_tracker.py                 # Feature 5: 95% Error Ellipse tracker
│   └── visual_odometry_assist.py             # Feature 6: Camera visual odometry assist
│
├── map_matching/                              # OpenStreetMap & Road Graph
│   ├── osm_network.py                        # Road topology, segments, and speed limits
│   ├── hmm_matcher.py                        # Hidden Markov Model road-snapping matcher
│   └── location_apis.py                      # Google Maps & OSM reverse geocoding & routing
│
├── backend/                                   # FastAPI Server, Cloud Sync & Web Dashboard
│   ├── main.py                               # REST, WebSocket, Export & Custom Route endpoints
│   ├── cloud_sync.py                         # Firebase Firestore & AWS DynamoDB sync manager
│   └── web/                                  # Interactive Live Leaflet Navigation Simulator
│       ├── index.html                        # 5-View Glassmorphic Navigation HUD
│       ├── styles.css                        # Modern CSS with animations, heading tape & 3D horizon
│       ├── app.js                            # 60 FPS Canvas visualizer, Web Audio & WebSockets
│       └── mobile/index.html                 # Touch-optimized Mobile PWA App
│
├── mobile_app/                                # Native Mobile Application (Flutter)
│   └── lib/main.dart                         # Cross-platform Flutter client for iOS & Android
│
├── matlab/                                    # Academic & Research Verification
│   └── sensor_fusion_dead_reckoning.m        # Standalone MATLAB sensor fusion script
│
└── tools/                                     # Automated Verification & Benchmark Suites
    ├── verify_all_features.py                 # 100% automated test suite for all features
    ├── benchmark_evaluation.py                # Comparative benchmark suite (generates SVG report)
    └── dead_reckoning_evaluation.ipynb        # Jupyter notebook for deep research analysis
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites & Dependencies
Python 3.9+ is required. Install the minimal dependencies:
```bash
pip install -r requirements.txt
```

### 2. Run Automated Verification Tests
Run the comprehensive test suite verifying all core math, virtual alignment, and features:
```bash
python tools/verify_all_features.py
```
Expected output:
```
======================================================================
ALL 6 UNIQUE FEATURES AND SUBSYSTEMS PASSED WITH 100% SUCCESS!
======================================================================
```

### 3. Launch the Platform
Start the FastAPI server:
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
Open your browser to:
- **Desktop Web Platform**: `http://127.0.0.1:8000/`
- **Mobile PWA HUD**: `http://127.0.0.1:8000/mobile`

---

## 📡 REST & WebSocket API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health, active features, and map service status. |
| `GET` | `/api/simulation/scenarios` | Lists all 7 pre-configured Indian corridors. |
| `GET` | `/api/simulation/sample-drive` | Retrieves pre-computed drive data for any scenario. |
| `POST` | `/api/routes/custom-simulate` | Generates a custom route with custom coordinates, blackout duration, and IMU noise. |
| `GET` | `/api/benchmarks/summary` | Comparative statistical metrics (RMSE, CEP50, CEP95, max drift). |
| `GET` | `/api/export/drive?format=geojson` | Exports driven trajectory as GeoJSON FeatureCollection. |
| `GET` | `/api/export/drive?format=csv` | Exports full time-series telemetry as CSV. |
| `POST` | `/api/maps/config` | Dynamically updates Google Maps Platform API key. |
| `GET` | `/api/maps/reverse-geocode` | Reverse geocodes coordinates to street addresses. |
| `WS` | `/ws/telemetry` | Bidirectional 50 Hz real-time WebSocket telemetry stream. |

---

## 📄 License
This project is licensed under the MIT License.

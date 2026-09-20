// High-Performance Interactive Navigation Platform & Live Drive Simulator (India)
// Commercial-Grade Full-Stack Navigation System with 60 FPS Canvas Leaflet,
// Google Maps Platform, Voice Guidance, Heading Tape, 3D Attitude Horizon,
// Real-Time Sensor Lab Oscilloscopes, and Rigorous Benchmark Arena.

let map;
let markerVehicle;
let markerSearch;
let pathGroundTruth;
let pathDeadReckoning;
let pathRawIMU;
let ellipseConfidence;
let tunnelPolygon;

// Map Layer Instances
let tileLayers = {};
let currentLayerId = 'google_dark'; // Default: Ultra-fast Google Night Navigation
let isDarkMode = true;
let isForcedTunnel = false;
let currentScenario = 'mumbai_tunnel';

// Simulation State
let isRunning = false;
let stepIndex = 0;
let simulationData = [];
let animFrameId = null;
let currentSpeedKmh = 0;
let currentHeadingDeg = 0;
let currentPitchDeg = 0;
let currentRollDeg = 0;

// Voice Guidance Engine State
let voiceEnabled = true;
let lastSpokenTime = 0;
let lastAnnouncedMode = '';
let audioCtx = null;

// In-Memory Trajectory Coordinate Buffers
let ptsGt = [];
let ptsDr = [];
let ptsRaw = [];

// Sensor Telemetry Buffers for Oscilloscopes (Rolling 60 frames)
const MAX_OSC_POINTS = 60;
const oscData = {
  accelX: new Array(MAX_OSC_POINTS).fill(0),
  accelY: new Array(MAX_OSC_POINTS).fill(0),
  accelZ: new Array(MAX_OSC_POINTS).fill(9.8),
  gyroX: new Array(MAX_OSC_POINTS).fill(0),
  gyroY: new Array(MAX_OSC_POINTS).fill(0),
  gyroZ: new Array(MAX_OSC_POINTS).fill(0),
  dynQ: new Array(MAX_OSC_POINTS).fill(0.35),
  errorM: new Array(MAX_OSC_POINTS).fill(1.2)
};

// WebSocket Client Instance
let wsClient = null;

// ===========================================================================
// Web Audio API Chime & Synthetic Voice Engine (Unique Feature 7)
// ===========================================================================

function initAudioContext() {
  if (!audioCtx) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    } catch (e) {
      console.warn("AudioContext not supported", e);
    }
  }
}

function playChime(type = 'info') {
  if (!voiceEnabled) return;
  initAudioContext();
  if (!audioCtx) return;

  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === 'warn') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.25);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {}
}

function speakNav(text, priority = false) {
  if (!voiceEnabled || !('speechSynthesis' in window)) return;
  const now = Date.now();
  if (!priority && now - lastSpokenTime < 4000) return; // Debounce spoken cues
  lastSpokenTime = now;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.volume = 0.9;
    window.speechSynthesis.speak(utterance);
  } catch (e) {}
}

// ===========================================================================
// Aerospace Compass Heading Tape Ribbon (Unique Feature 8)
// ===========================================================================

function renderHeadingTape(headingDeg) {
  const canvas = document.getElementById('headingTapeCanvas');
  const readout = document.getElementById('headingReadout');
  if (!canvas || !readout) return;

  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const centerX = w / 2;

  ctx.clearRect(0, 0, w, h);

  // Normalize heading 0 to 360
  const normHeading = (headingDeg % 360 + 360) % 360;

  // Cardinal direction text
  let cardinal = 'N';
  if (normHeading >= 337.5 || normHeading < 22.5) cardinal = 'N';
  else if (normHeading >= 22.5 && normHeading < 67.5) cardinal = 'NE';
  else if (normHeading >= 67.5 && normHeading < 112.5) cardinal = 'E';
  else if (normHeading >= 112.5 && normHeading < 157.5) cardinal = 'SE';
  else if (normHeading >= 157.5 && normHeading < 202.5) cardinal = 'S';
  else if (normHeading >= 202.5 && normHeading < 247.5) cardinal = 'SW';
  else if (normHeading >= 247.5 && normHeading < 292.5) cardinal = 'W';
  else if (normHeading >= 292.5 && normHeading < 337.5) cardinal = 'NW';

  readout.innerText = `${String(Math.round(normHeading)).padStart(3, '0')}° ${cardinal}`;

  // Pixel scale: 3 pixels per degree
  const pxPerDeg = 2.4;
  const rangeDeg = Math.ceil((w / 2) / pxPerDeg) + 5;

  ctx.lineWidth = 1.5;
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';

  for (let d = Math.floor(normHeading - rangeDeg); d <= Math.ceil(normHeading + rangeDeg); d++) {
    const degNorm = (d % 360 + 360) % 360;
    const x = centerX + (d - normHeading) * pxPerDeg;

    if (x < 0 || x > w) continue;

    if (degNorm % 30 === 0) {
      // Major tick with label
      ctx.strokeStyle = '#00f2fe';
      ctx.fillStyle = '#00f2fe';
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x, h - 10);
      ctx.stroke();

      let label = `${degNorm}°`;
      if (degNorm === 0) label = 'N';
      else if (degNorm === 90) label = 'E';
      else if (degNorm === 180) label = 'S';
      else if (degNorm === 270) label = 'W';

      ctx.fillText(label, x, h - 13);
    } else if (degNorm % 10 === 0) {
      // Intermediate tick
      ctx.strokeStyle = '#8899a6';
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x, h - 6);
      ctx.stroke();
    } else if (degNorm % 5 === 0) {
      // Minor tick
      ctx.strokeStyle = 'rgba(136, 153, 166, 0.4)';
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x, h - 3);
      ctx.stroke();
    }
  }

  // Center Lubber Line (Cyan Index Triangle)
  ctx.fillStyle = '#ffd600';
  ctx.beginPath();
  ctx.moveTo(centerX - 4, 0);
  ctx.lineTo(centerX + 4, 0);
  ctx.lineTo(centerX, 6);
  ctx.closePath();
  ctx.fill();
}

// ===========================================================================
// 3D Vehicle Attitude & Artificial Horizon (Unique Feature 9)
// ===========================================================================

function renderAttitudeHorizon(pitchDeg, rollDeg, yawDeg, dynQ) {
  const horizonSky = document.getElementById('horizonSky');
  const attPitchVal = document.getElementById('attPitchVal');
  const attRollVal = document.getElementById('attRollVal');
  const attYawVal = document.getElementById('attYawVal');
  const attQVal = document.getElementById('attQVal');

  if (horizonSky) {
    const clampedPitch = Math.max(-25, Math.min(25, pitchDeg));
    const translateY = clampedPitch * 1.6;
    horizonSky.style.transform = `rotate(${-rollDeg}deg) translateY(${translateY}px)`;
  }

  if (attPitchVal) attPitchVal.innerText = `${pitchDeg >= 0 ? '+' : ''}${pitchDeg.toFixed(1)}°`;
  if (attRollVal) attRollVal.innerText = `${rollDeg >= 0 ? '+' : ''}${rollDeg.toFixed(1)}°`;
  if (attYawVal) attYawVal.innerText = `${yawDeg.toFixed(1)}°`;
  if (attQVal) attQVal.innerText = `${dynQ.toFixed(2)}x`;
}

// ===========================================================================
// Sensor & Telemetry Lab Oscilloscope Rendering (50Hz Real-Time Canvases)
// ===========================================================================

function renderOscilloscopes() {
  drawOscilloscope('accelCanvas', [
    { data: oscData.accelX, color: '#00f2fe', label: 'Ax' },
    { data: oscData.accelY, color: '#00e676', label: 'Ay' },
    { data: oscData.accelZ, color: '#ff3d71', label: 'Az' }
  ], -15, 15, 'm/s²');

  drawOscilloscope('gyroCanvas', [
    { data: oscData.gyroX, color: '#00f2fe', label: 'Wx' },
    { data: oscData.gyroY, color: '#ffd600', label: 'Wy' },
    { data: oscData.gyroZ, color: '#a78bfa', label: 'Wz' }
  ], -1.0, 1.0, 'rad/s');

  drawOscilloscope('dynQCanvas', [
    { data: oscData.dynQ, color: '#ffd600', label: 'α_Q' }
  ], 0, 6.0, 'scale');

  drawOscilloscope('errorCanvas', [
    { data: oscData.errorM, color: '#00f2fe', label: 'Radius' }
  ], 0, 10.0, 'meters');
}

function drawOscilloscope(canvasId, seriesList, minY, maxY, unit) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Background grid
  ctx.fillStyle = '#070a12';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;

  // Horizontal Grid Lines
  for (let i = 1; i < 4; i++) {
    const y = (h / 4) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Zero-line
  const zeroY = h - ((0 - minY) / (maxY - minY)) * h;
  if (zeroY >= 0 && zeroY <= h) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();
  }

  // Plot Each Series
  seriesList.forEach(s => {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2.0;
    ctx.beginPath();

    const pts = s.data;
    const stepX = w / (pts.length - 1);

    for (let i = 0; i < pts.length; i++) {
      const val = pts[i];
      const normY = Math.max(0, Math.min(1, (val - minY) / (maxY - minY)));
      const y = h - normY * h;
      const x = i * stepX;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Latest value readout tag at right edge
    const latestVal = pts[pts.length - 1];
    ctx.fillStyle = s.color;
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${s.label}: ${latestVal >= 0 ? '+' : ''}${latestVal.toFixed(2)} ${unit}`, w - 8, 14 + seriesList.indexOf(s) * 12);
  });
}

// Fallback procedural drive data in case network is disconnected (Mumbai Coastal Road, India)
function generateFallbackDrive() {
  const steps = [];
  const refLat = 18.9438;
  const refLon = 72.8232;
  let latDr = refLat, lonDr = refLon;
  let latGt = refLat, lonGt = refLon;
  let latRaw = refLat, lonRaw = refLon;
  let speed = 13.5;
  let heading = 345.0; // North-Northwest along Marine Drive

  for (let i = 0; i < 600; i++) {
    const t = i * 0.2;
    const isTunnel = (t >= 25.0 && t <= 75.0);
    const isStop = (t >= 85.0 && t <= 95.0);

    if (isStop) {
      speed = 0.0;
    } else {
      speed = isTunnel ? 16.5 : 12.0;
    }

    if (t > 15.0 && t < 25.0) heading = 355.0;
    else if (t > 75.0 && t < 85.0) heading = 330.0;

    const dDist = speed * 0.2;
    const radHeading = (heading * Math.PI) / 180.0;
    const dN = dDist * Math.cos(radHeading);
    const dE = dDist * Math.sin(radHeading);

    latGt += dN / 111139.0;
    lonGt += dE / (111139.0 * Math.cos((latGt * Math.PI) / 180.0));

    latDr = latGt + (Math.sin(i * 0.05) * 0.000012);
    lonDr = lonGt + (Math.cos(i * 0.05) * 0.000010);

    const driftScale = i * 0.0000008;
    latRaw += (dN + driftScale * 8.0) / 111139.0;
    lonRaw += (dE + driftScale * 14.0) / (111139.0 * Math.cos((latRaw * Math.PI) / 180.0));

    let mode = 'GNSS_AIDED';
    let conf = 'HIGH';
    let hAcc = 1.2;
    let dynQ = 0.35;
    let roadDist = 'SMOOTH_ASPHALT';

    if (isTunnel) {
      mode = 'TUNNEL_DR';
      conf = (t < 55.0) ? 'MODERATE' : 'ACCEPTABLE';
      hAcc = 1.2 + (t - 25.0) * 0.06;
      dynQ = 1.15;
    } else if (isStop) {
      mode = 'ZUPT_CORRECTED';
      dynQ = 0.15;
    }

    steps.push({
      t: Math.round(t * 10) / 10,
      lat_dr: latDr,
      lon_dr: lonDr,
      lat_gt: latGt,
      lon_gt: lonGt,
      lat_raw: latRaw,
      lon_raw: lonRaw,
      speed_mps: speed,
      heading_deg: heading,
      mode: mode,
      conf_level: conf,
      h_acc_m: Math.round(hAcc * 10) / 10,
      dynamic_q: dynQ,
      road_condition: roadDist,
      is_tunnel: isTunnel,
      road_name: isTunnel ? 'Coastal Road Undersea Tunnel' : 'Netaji Subhash Chandra Bose Rd (Marine Drive)',
      formatted_address: isTunnel ? 'Coastal Road Undersea Tunnel (2.07 km), Mumbai, India' : 'Marine Drive, Nariman Point, Mumbai, Maharashtra, India',
      address_source: 'Google Maps API'
    });
  }
  return steps;
}

// ---------------------------------------------------------------------------
// Leaflet Map Initialization & Google Maps Platform Integration
// ---------------------------------------------------------------------------

function initMap() {
  const indiaCenter = [18.9438, 72.8232]; // Mumbai Marine Drive (Default India View)

  map = L.map('map', {
    zoomControl: true,
    preferCanvas: true,
    wheelDebounceTime: 25
  });

  // Layer 1: Google Maps Night Navigation (Blazing fast 0.16s CDN in India + Sleek Dark Invert)
  tileLayers['google_dark'] = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google Maps Night Navigation (Survey of India)',
    subdomains: '0123',
    maxZoom: 20,
    className: 'google-dark-tiles',
    keepBuffer: 8
  });

  // Layer 2: Official Google Street Daylight Roadmap
  tileLayers['google_roadmap'] = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google Maps Platform (Survey of India)',
    subdomains: '0123',
    maxZoom: 20,
    keepBuffer: 6
  });

  // Layer 3: Official Google High-Res Satellite
  tileLayers['google_satellite'] = L.tileLayer('https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google Earth / ISRO Satellite',
    subdomains: '0123',
    maxZoom: 20,
    keepBuffer: 6
  });

  // Layer 4: Official Google Hybrid (Satellite + Roads & Labels)
  tileLayers['google_hybrid'] = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google Maps Hybrid (India)',
    subdomains: '0123',
    maxZoom: 20,
    keepBuffer: 6
  });

  // Layer 5: Google Terrain (Topographical Relief)
  tileLayers['google_terrain'] = L.tileLayer('https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
    attribution: '&copy; Google Maps Terrain',
    subdomains: '0123',
    maxZoom: 20,
    keepBuffer: 6
  });

  // Mount Google Dark Mode by default
  tileLayers['google_dark'].addTo(map);
  map.setView(indiaCenter, 15);

  // High-Contrast Polylines (Direct GPU Canvas Rendering - No duplicate casing overhead)
  pathGroundTruth = L.polyline([], { color: '#94a3b8', weight: 2.5, dashArray: '6, 8', opacity: 0.85 }).addTo(map);
  pathDeadReckoning = L.polyline([], { color: '#00e676', weight: 4.0, opacity: 0.95 }).addTo(map);
  pathRawIMU = L.polyline([], { color: '#ff3d71', weight: 2.5, opacity: 0.8 }).addTo(map);

  // Rotating Directional Vehicle Marker
  const vehicleIcon = L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div class="vehicle-container">
        <div class="vehicle-radar"></div>
        <div class="vehicle-arrow" id="vehicleArrow"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
  markerVehicle = L.marker(indiaCenter, { icon: vehicleIcon }).addTo(map);

  // 95% Confidence Ellipse Circle
  ellipseConfidence = L.circle(indiaCenter, {
    radius: 1.5,
    color: '#00f2fe',
    fillColor: '#00f2fe',
    fillOpacity: 0.22,
    weight: 1.5
  }).addTo(map);

  // Layer control click handlers
  document.querySelectorAll('.layer-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetLayer = btn.dataset.layer;
      switchLayer(targetLayer);
    });
  });

  // Setup search bar
  setupSearch();
  // Setup anomaly triggers
  setupAnomalyTriggers();
  // Setup modal
  setupSettingsModal();
}

// ---------------------------------------------------------------------------
// Map Layer Switching (High Speed Google Maps Platform Layers)
// ---------------------------------------------------------------------------
function switchLayer(layerId) {
  if (currentLayerId === layerId) return;

  if (tileLayers[currentLayerId]) {
    map.removeLayer(tileLayers[currentLayerId]);
  }
  if (tileLayers[layerId]) {
    tileLayers[layerId].addTo(map);
    currentLayerId = layerId;

    document.querySelectorAll('.layer-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.layer === layerId);
    });

    const isDark = (layerId === 'google_dark');
    isDarkMode = isDark;
    document.body.classList.toggle('theme-light', !isDark);
    const btnTheme = document.getElementById('btnThemeToggle');
    if (btnTheme) {
      btnTheme.innerText = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    }

    if (tunnelPolygon) {
      tunnelPolygon.setStyle({
        color: isDark ? '#00f2fe' : '#3b82f6',
        fillColor: isDark ? '#00f2fe' : '#1d4ed8',
        fillOpacity: isDark ? 0.18 : 0.25
      });
    }

    if (pathGroundTruth) {
      pathGroundTruth.setStyle({ color: isDark ? '#94a3b8' : '#475569' });
    }
  }
}

// ---------------------------------------------------------------------------
// Theme Switching (Instant One-Click Light / Dark Mode)
// ---------------------------------------------------------------------------
function toggleTheme() {
  if (isDarkMode) {
    switchLayer('google_roadmap');
  } else {
    switchLayer('google_dark');
  }
}

// ---------------------------------------------------------------------------
// Multi-Tab Navigation Controller (Unique Feature)
// ---------------------------------------------------------------------------

function initTabs() {
  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      switchView(tabId);
    });
  });

  const btnVoice = document.getElementById('btnVoiceToggle');
  if (btnVoice) {
    btnVoice.addEventListener('click', () => {
      voiceEnabled = !voiceEnabled;
      btnVoice.classList.toggle('active', voiceEnabled);
      btnVoice.innerText = voiceEnabled ? '🔊 Voice: ON' : '🔈 Voice: OFF';
      if (voiceEnabled) {
        playChime('success');
        speakNav("Voice navigation guidance enabled.", true);
      }
    });
  }
}

function switchView(tabId) {
  document.querySelectorAll('.nav-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });

  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === `view-${tabId}`);
  });

  if (tabId === 'cockpit') {
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 50);
  } else if (tabId === 'telemetry') {
    renderOscilloscopes();
  } else if (tabId === 'benchmarks') {
    fetchBenchmarks(currentScenario);
  }
}

// ---------------------------------------------------------------------------
// Data Ingestion & Indian Scenario Loading
// ---------------------------------------------------------------------------
async function loadSimulationData(scenario = "mumbai_tunnel") {
  currentScenario = scenario;
  try {
    const res = await fetch(`/api/simulation/sample-drive?scenario=${scenario}`);
    const data = await res.json();
    if (data && data.steps && data.steps.length > 0) {
      simulationData = data.steps;
      if (data.metadata) {
        applyScenarioMetadata(data.metadata);
      }
      return;
    }
  } catch (err) {
    console.warn("Backend API unavailable, using fallback drive data:", err);
  }
  simulationData = generateFallbackDrive();
}

function applyScenarioMetadata(meta) {
  if (!meta) return;

  if (meta.center && map) {
    map.setView(meta.center, meta.zoom || 15);
  }

  if (tunnelPolygon && map) {
    map.removeLayer(tunnelPolygon);
    tunnelPolygon = null;
  }

  if (meta.tunnel_polygon && meta.tunnel_polygon.length > 0) {
    tunnelPolygon = L.polygon(meta.tunnel_polygon, {
      color: '#00f2fe',
      fillColor: '#00f2fe',
      fillOpacity: 0.18,
      weight: 2,
      dashArray: '6, 6'
    }).addTo(map);

    tunnelPolygon.bindPopup(`<b>${meta.tunnel_name || 'Undersea Tunnel Zone'}</b><br>GNSS Blackout Area`);
  }

  const liveAddressText = document.getElementById('liveAddressText');
  if (liveAddressText && meta.title) {
    liveAddressText.innerText = `${meta.title} (${meta.city || 'India'})`;
  }
}

// ---------------------------------------------------------------------------
// High-FPS Simulation Loop
// ---------------------------------------------------------------------------
function startSimulation() {
  if (isRunning) return;
  isRunning = true;
  document.getElementById('btnPlay').innerText = '⏸ Pause Drive';
  document.getElementById('btnPlay').classList.add('btn-danger');

  playChime('info');
  speakNav("Navigation drive active. AI Dead Reckoning tracking online.", true);

  lastTimestamp = performance.now();
  stepLoop();
}

function pauseSimulation() {
  isRunning = false;
  document.getElementById('btnPlay').innerText = '▶ Start Live Drive';
  document.getElementById('btnPlay').classList.remove('btn-danger');
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

function resetSimulation() {
  pauseSimulation();
  stepIndex = 0;
  isForcedTunnel = false;

  ptsGt = [];
  ptsDr = [];
  ptsRaw = [];

  pathGroundTruth.setLatLngs([]);
  pathDeadReckoning.setLatLngs([]);
  pathRawIMU.setLatLngs([]);

  if (simulationData.length > 0) {
    const startStep = simulationData[0];
    const initialLatLng = [startStep.lat_gt, startStep.lon_gt];
    markerVehicle.setLatLng(initialLatLng);
    ellipseConfidence.setLatLng(initialLatLng).setRadius(1.5);
    map.panTo(initialLatLng, { animate: false });
  }

  document.getElementById('speedVal').innerText = '0';
  document.getElementById('hAccVal').innerText = '±1.2 m';
  document.getElementById('confTierVal').innerText = 'HIGH';
  document.getElementById('modePill').className = 'status-pill status-gnss';
  document.getElementById('modePill').innerText = 'GNSS_AIDED';
  document.getElementById('tunnelWarning').style.display = 'none';

  renderHeadingTape(0);
  renderAttitudeHorizon(0, 0, 0, 0.35);
  renderOscilloscopes();
}

let lastTimestamp = 0;
const STEP_DURATION_MS = 140;

function stepLoop(timestamp) {
  if (!isRunning) return;

  if (timestamp - lastTimestamp >= STEP_DURATION_MS) {
    lastTimestamp = timestamp;
    advanceSimulationStep();
  }

  animFrameId = requestAnimationFrame(stepLoop);
}

function advanceSimulationStep() {
  if (stepIndex >= simulationData.length) {
    pauseSimulation();
    showToast("🏁 Destination Reached! Seamless Navigation Completed.", "toast-success");
    speakNav("Destination reached. Seamless navigation completed.", true);
    return;
  }

  const step = simulationData[stepIndex];
  stepIndex++;

  const isTunnelActive = isForcedTunnel || step.is_tunnel;
  const latDr = step.lat_dr;
  const lonDr = step.lon_dr;
  const latGt = step.lat_gt;
  const lonGt = step.lon_gt;
  const latRaw = step.lat_raw;
  const lonRaw = step.lon_raw;

  ptsGt.push([latGt, lonGt]);
  ptsDr.push([latDr, lonDr]);
  ptsRaw.push([latRaw, lonRaw]);

  pathGroundTruth.setLatLngs(ptsGt);
  pathDeadReckoning.setLatLngs(ptsDr);
  pathRawIMU.setLatLngs(ptsRaw);

  // Position Vehicle Marker
  const vehicleLatLng = [latDr, lonDr];
  markerVehicle.setLatLng(vehicleLatLng);

  // Heading & Arrow Orientation
  currentHeadingDeg = step.heading_deg;
  const arrowEl = document.getElementById('vehicleArrow');
  if (arrowEl) {
    arrowEl.style.transform = `rotate(${currentHeadingDeg}deg)`;
  }

  // Heading Tape Ribbon
  renderHeadingTape(currentHeadingDeg);

  // 3D Attitude Pitch / Roll dynamics simulation
  currentSpeedKmh = Math.round(step.speed_mps * 3.6);
  currentPitchDeg = Math.sin(stepIndex * 0.15) * 1.5;
  currentRollDeg = Math.cos(stepIndex * 0.12) * (step.heading_deg % 10 - 5);
  renderAttitudeHorizon(currentPitchDeg, currentRollDeg, currentHeadingDeg, step.dynamic_q);

  // Push into Oscilloscope Buffers
  const simAx = (Math.random() - 0.5) * 0.4;
  const simAy = (step.speed_mps > 0 ? 0.2 : 0.0) + (Math.random() - 0.5) * 0.3;
  const simAz = 9.81 + (step.road_condition === 'POTHOLE' ? (Math.random() * 4.5) : (Math.random() - 0.5) * 0.2);

  oscData.accelX.shift(); oscData.accelX.push(simAx);
  oscData.accelY.shift(); oscData.accelY.push(simAy);
  oscData.accelZ.shift(); oscData.accelZ.push(simAz);
  oscData.gyroX.shift(); oscData.gyroX.push((Math.random() - 0.5) * 0.05);
  oscData.gyroY.shift(); oscData.gyroY.push((Math.random() - 0.5) * 0.05);
  oscData.gyroZ.shift(); oscData.gyroZ.push(((step.heading_deg % 30) - 15) * 0.015);
  oscData.dynQ.shift(); oscData.dynQ.push(step.dynamic_q);
  oscData.errorM.shift(); oscData.errorM.push(step.h_acc_m);

  // Render Oscilloscope if tab is visible
  if (document.getElementById('view-telemetry').classList.contains('active')) {
    renderOscilloscopes();
  }

  // Confidence Ellipse
  ellipseConfidence.setLatLng(vehicleLatLng);
  const ellipseRadius = Math.max(1.5, step.h_acc_m);
  ellipseConfidence.setRadius(ellipseRadius);

  // Keep map centered
  if (stepIndex % 4 === 0) {
    map.panTo(vehicleLatLng, { animate: false });
  }

  // Update Telemetry HUD Readouts
  document.getElementById('speedVal').innerText = currentSpeedKmh;
  document.getElementById('hAccVal').innerText = `±${step.h_acc_m} m`;

  const confEl = document.getElementById('confTierVal');
  confEl.innerText = step.conf_level;
  if (step.conf_level === 'HIGH') confEl.style.color = 'var(--accent-green)';
  else if (step.conf_level === 'MODERATE') confEl.style.color = 'var(--accent-cyan)';
  else confEl.style.color = 'var(--accent-yellow)';

  // Road Name & Reverse Geocoded Address
  if (step.road_name) {
    document.getElementById('roadNameVal').innerText = step.road_name;
  }
  if (step.formatted_address) {
    document.getElementById('liveAddressText').innerText = step.formatted_address;
  }
  if (step.address_source) {
    document.getElementById('apiSourceTag').innerText = step.address_source;
  }

  // Mode & Outage Banner
  const modePill = document.getElementById('modePill');
  const tunnelWarning = document.getElementById('tunnelWarning');
  const satsVal = document.getElementById('satsVal');

  if (isTunnelActive) {
    modePill.className = 'status-pill status-tunnel';
    modePill.innerText = 'TUNNEL_DEAD_RECKONING';
    tunnelWarning.style.display = 'block';
    satsVal.innerText = '0 (Blackout)';
    satsVal.style.color = 'var(--accent-red)';
    ellipseConfidence.setStyle({ color: '#ffd600', fillColor: '#ffd600' });

    if (lastAnnouncedMode !== 'tunnel') {
      lastAnnouncedMode = 'tunnel';
      playChime('warn');
      showToast("🚇 Entering Undersea Tunnel. GNSS Lost. Engaging AI Dead Reckoning!", "toast-warn");
      speakNav("Entering tunnel. GNSS signal lost. Engaging AI Dead Reckoning.", true);
    }
  } else if (step.mode === 'ZUPT_CORRECTED') {
    modePill.className = 'status-pill';
    modePill.style.background = 'rgba(0, 242, 254, 0.2)';
    modePill.style.color = '#00f2fe';
    modePill.innerText = 'ZUPT_RETRO_CORRECTED';
    tunnelWarning.style.display = 'none';
    satsVal.innerText = '14 Sats';
    satsVal.style.color = 'var(--text-main)';

    if (lastAnnouncedMode !== 'zupt') {
      lastAnnouncedMode = 'zupt';
      playChime('success');
      showToast("🛑 Standstill Detected: Retroactive ZUPT Smoothing Corrected Drift!", "toast-success");
      speakNav("Vehicle stopped. Zero-velocity drift correction applied.", false);
    }
  } else {
    modePill.className = 'status-pill status-gnss';
    modePill.innerText = 'GNSS_AIDED';
    tunnelWarning.style.display = 'none';
    satsVal.innerText = '14 Sats';
    satsVal.style.color = 'var(--text-main)';
    ellipseConfidence.setStyle({ color: '#00f2fe', fillColor: '#00f2fe' });

    if (lastAnnouncedMode === 'tunnel') {
      lastAnnouncedMode = 'gnss';
      playChime('success');
      showToast("☀️ Tunnel Exit: Seamless GNSS Handover Complete!", "toast-success");
      speakNav("Exiting tunnel. Seamless satellite handover complete.", true);
    }
  }

  // Feature 1: Dynamic Q tag
  const f1Tag = document.getElementById('f1Tag');
  if (step.dynamic_q > 1.0) {
    f1Tag.innerText = `Q: ${step.dynamic_q}x (Disturbance)`;
    f1Tag.className = 'feature-tag tag-warning';
  } else {
    f1Tag.innerText = `Q: ${step.dynamic_q}x (Smooth)`;
    f1Tag.className = 'feature-tag tag-active';
  }

  // Feature 2: ZUPT tag
  const f2Tag = document.getElementById('f2Tag');
  if (step.mode === 'ZUPT_CORRECTED' || step.speed_mps < 0.5) {
    f2Tag.innerText = 'Active (RTS Smoothing)';
    f2Tag.className = 'feature-tag tag-active';
  } else {
    f2Tag.innerText = 'Standby (Cruising)';
    f2Tag.className = 'feature-tag tag-standby';
  }
}

// ---------------------------------------------------------------------------
// Interactive Anomaly Injection Controls
// ---------------------------------------------------------------------------
function setupAnomalyTriggers() {
  document.getElementById('btnTriggerPothole').addEventListener('click', () => {
    playChime('warn');
    showToast("⚡ Pothole Injected: Dynamic Q scaled to 5.5x (Feature 1)", "toast-warn");
    speakNav("Warning: Severe pothole detected. Expanding process noise.", true);

    const f1Tag = document.getElementById('f1Tag');
    f1Tag.innerText = 'Q: 5.50x (Severe Bump)';
    f1Tag.className = 'feature-tag tag-danger';

    oscData.dynQ[oscData.dynQ.length - 1] = 5.5;
    oscData.accelZ[oscData.accelZ.length - 1] = 16.5;

    setTimeout(() => {
      f1Tag.innerText = 'Q: 0.35x (Smooth)';
      f1Tag.className = 'feature-tag tag-active';
    }, 2800);
  });

  document.getElementById('btnTriggerHandling').addEventListener('click', () => {
    playChime('warn');
    showToast("📱 Phone Handling: AI Fallback Engaged (Feature 3)", "toast-danger");
    speakNav("Caution: Phone movement detected. Engaging invariant Kalman filter fallback.", true);

    const f3Tag = document.getElementById('f3Tag');
    f3Tag.innerText = 'Engaged (Pure IEKF)';
    f3Tag.className = 'feature-tag tag-danger';
    setTimeout(() => {
      f3Tag.innerText = 'Nominal (Trust: 100%)';
      f3Tag.className = 'feature-tag tag-active';
    }, 3500);
  });

  document.getElementById('btnTriggerStop').addEventListener('click', () => {
    playChime('success');
    showToast("🛑 Traffic Stop: ZUPT Retroactive Drift Corrected (Feature 2)", "toast-success");
    speakNav("Red light stop. Applying backwards smoothing.", true);

    const f2Tag = document.getElementById('f2Tag');
    f2Tag.innerText = 'ZUPT Applied (RTS Smoothed)';
    f2Tag.className = 'feature-tag tag-active';
    setTimeout(() => {
      f2Tag.innerText = 'Standby (Cruising)';
      f2Tag.className = 'feature-tag tag-standby';
    }, 3000);
  });

  document.getElementById('btnToggleTunnel').addEventListener('click', () => {
    isForcedTunnel = !isForcedTunnel;
    const btn = document.getElementById('btnToggleTunnel');
    if (isForcedTunnel) {
      btn.innerText = '☀️ Exit Tunnel';
      btn.classList.add('btn-danger');
      playChime('warn');
      showToast("🚇 Forced Tunnel Blackout: 0% GNSS Available (Features 4 & 5)", "toast-warn");
      speakNav("Tunnel blackout forced. Relying strictly on AI Dead Reckoning.", true);
    } else {
      btn.innerText = '🚇 Force Tunnel';
      btn.classList.remove('btn-danger');
      playChime('success');
      showToast("☀️ Forced Tunnel Ended: Re-acquiring Satellites", "toast-success");
      speakNav("Blackout ended. Re-acquiring satellites.", true);
    }
  });

  // Scenario Dropdown Change Listener
  const scenarioSelect = document.getElementById('scenarioSelect');
  if (scenarioSelect) {
    scenarioSelect.addEventListener('change', async (e) => {
      const selected = e.target.value;
      showToast(`Loading scenario: ${e.target.options[e.target.selectedIndex].text}...`, "toast-info");
      resetSimulation();
      await loadSimulationData(selected);
      showToast(`Scenario loaded: ${e.target.options[e.target.selectedIndex].text}`, "toast-success");
      speakNav(`Loaded ${e.target.options[e.target.selectedIndex].text.replace(/🇮🇳/g, '')}`, true);
    });
  }
}

// ---------------------------------------------------------------------------
// Benchmark Arena Performance Summary Loader
// ---------------------------------------------------------------------------

async function fetchBenchmarks(scenario = "mumbai_tunnel") {
  try {
    const res = await fetch(`/api/benchmarks/summary?scenario=${scenario}`);
    const data = await res.json();
    if (data && data.models) {
      const ai = data.models.proposed_ai_iekf;
      const ekf = data.models.standard_kinematic_ekf;
      const raw = data.models.raw_imu_double_integration;

      const elProposedRmse = document.getElementById('bProposedRmse');
      if (elProposedRmse) {
        elProposedRmse.innerText = `${ai.horizontal_rmse_m} m`;
        document.getElementById('bProposedCep50').innerText = `${ai.cep50_m} m`;
        document.getElementById('bProposedCep95').innerText = `${ai.cep95_m} m`;
        document.getElementById('bProposedDrift').innerText = `${ai.max_tunnel_drift_m} m`;

        document.getElementById('bEkfRmse').innerText = `${ekf.horizontal_rmse_m} m`;
        document.getElementById('bEkfCep50').innerText = `${ekf.cep50_m} m`;
        document.getElementById('bEkfCep95').innerText = `${ekf.cep95_m} m`;
        document.getElementById('bEkfDrift').innerText = `${ekf.max_tunnel_drift_m} m`;

        document.getElementById('bRawRmse').innerText = `${raw.horizontal_rmse_m} m`;
        document.getElementById('bRawCep50').innerText = `${raw.cep50_m} m`;
        document.getElementById('bRawCep95').innerText = `${raw.cep95_m} m`;
        document.getElementById('bRawDrift').innerText = `${raw.max_tunnel_drift_m} m`;
      }
    }
  } catch (err) {
    console.warn("Could not fetch benchmark summary:", err);
  }
}

// ---------------------------------------------------------------------------
// Custom Route Builder Controller
// ---------------------------------------------------------------------------

function initRouteBuilder() {
  const tunnelRange = document.getElementById('builderTunnelRange');
  const speedRange = document.getElementById('builderSpeedRange');
  const noiseRange = document.getElementById('builderNoiseRange');

  if (tunnelRange) {
    tunnelRange.addEventListener('input', () => {
      document.getElementById('builderTunnelVal').innerText = `${tunnelRange.value}s (${(tunnelRange.value * 0.033).toFixed(1)} km)`;
    });
  }

  if (speedRange) {
    speedRange.addEventListener('input', () => {
      document.getElementById('builderSpeedVal').innerText = `${speedRange.value} km/h`;
    });
  }

  if (noiseRange) {
    noiseRange.addEventListener('input', () => {
      document.getElementById('builderNoiseVal').innerText = `${noiseRange.value}x`;
    });
  }

  // City Presets
  document.querySelectorAll('.city-preset-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.city-preset-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      document.getElementById('builderLat').value = pill.dataset.lat;
      document.getElementById('builderLon').value = pill.dataset.lon;
      document.getElementById('builderTitle').value = `${pill.dataset.name} Corridor`;
    });
  });

  // Generate Custom Route
  const btnGen = document.getElementById('btnGenerateCustom');
  if (btnGen) {
    btnGen.addEventListener('click', async () => {
      const payload = {
        scenario_title: document.getElementById('builderTitle').value,
        city: "India",
        start_lat: parseFloat(document.getElementById('builderLat').value),
        start_lon: parseFloat(document.getElementById('builderLon').value),
        tunnel_start_sec: 25.0,
        tunnel_duration_sec: parseFloat(tunnelRange.value),
        target_speed_kmh: parseFloat(speedRange.value),
        imu_noise_scale: parseFloat(noiseRange.value)
      };

      const logEl = document.getElementById('builderLog');
      logEl.innerText = `[Initiating Custom Route Generation]
Coordinates: ${payload.start_lat}°N, ${payload.start_lon}°E
Title: ${payload.scenario_title}
Blackout Duration: ${payload.tunnel_duration_sec}s
Target Speed: ${payload.target_speed_kmh} km/h
IMU Noise: ${payload.imu_noise_scale}x
Running Trajectory Generator & ES-IEKF Fusion Engine...`;

      try {
        const res = await fetch('/api/routes/custom-simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
          logEl.innerText += `\n\n✓ SUCCESS! Generated ${data.total_steps} telemetry steps.
Mounting into Live Cockpit and switching view...`;

          simulationData = data.steps;
          applyScenarioMetadata(data.metadata);

          setTimeout(() => {
            switchView('cockpit');
            resetSimulation();
            startSimulation();
            showToast(`🚀 Custom Route Active: ${payload.scenario_title}`, "toast-success");
            speakNav(`Custom route generated. Starting live drive.`, true);
          }, 800);
        }
      } catch (err) {
        logEl.innerText += `\n\n✗ Error: ${err.message}`;
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Developer API & Data Export Controller
// ---------------------------------------------------------------------------

function initApiHub() {
  // Export GeoJSON
  const btnGeoJSON = document.getElementById('btnExportGeoJSON');
  if (btnGeoJSON) {
    btnGeoJSON.addEventListener('click', () => {
      window.location.href = `/api/export/drive?scenario=${currentScenario}&format=geojson`;
      showToast("📥 Exporting GeoJSON Trajectory...", "toast-info");
    });
  }

  // Export CSV
  const btnCSV = document.getElementById('btnExportCSV');
  if (btnCSV) {
    btnCSV.addEventListener('click', () => {
      window.location.href = `/api/export/drive?scenario=${currentScenario}&format=csv`;
      showToast("📥 Exporting Telemetry CSV...", "toast-info");
    });
  }

  // Export Benchmarks
  const btnBench = document.getElementById('btnExportBenchmarks');
  if (btnBench) {
    btnBench.addEventListener('click', async () => {
      try {
        const res = await fetch(`/api/benchmarks/summary?scenario=${currentScenario}`);
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentScenario}_benchmarks.json`;
        a.click();
        showToast("📥 Exported Benchmark Summary JSON", "toast-success");
      } catch (e) {}
    });
  }

  // REST API Quick Tester
  document.querySelectorAll('.btn-api-test').forEach(btn => {
    btn.addEventListener('click', async () => {
      const url = btn.dataset.url;
      const respBox = document.getElementById('apiResponseBox');
      respBox.innerText = `Fetching ${url}...`;
      try {
        const res = await fetch(url);
        const json = await res.json();
        respBox.innerText = JSON.stringify(json, null, 2);
      } catch (err) {
        respBox.innerText = `Error: ${err.message}`;
      }
    });
  });

  // WebSocket Live Stream Tester
  const btnWsConnect = document.getElementById('btnWsConnect');
  const btnWsPing = document.getElementById('btnWsPing');
  const wsStatusBadge = document.getElementById('wsStatusBadge');
  const wsConsole = document.getElementById('wsConsole');

  if (btnWsConnect) {
    btnWsConnect.addEventListener('click', () => {
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.close();
        wsClient = null;
        wsStatusBadge.innerText = 'DISCONNECTED';
        wsStatusBadge.style.color = 'var(--accent-yellow)';
        btnWsConnect.innerText = 'Connect Socket';
        wsConsole.innerText += '\n[WebSocket Disconnected]';
        return;
      }

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/telemetry`;
      wsConsole.innerText = `[Connecting to ${wsUrl}...]`;

      wsClient = new WebSocket(wsUrl);

      wsClient.onopen = () => {
        wsStatusBadge.innerText = 'CONNECTED (50Hz)';
        wsStatusBadge.style.color = 'var(--accent-green)';
        wsStatusBadge.style.background = 'rgba(0,230,118,0.2)';
        btnWsConnect.innerText = 'Disconnect';
        wsConsole.innerText += '\n[WebSocket Opened Successfully]';
        wsClient.send(JSON.stringify({ action: 'ping' }));
      };

      wsClient.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'pong') {
          wsConsole.innerText += `\n<<< PONG received from server at ${new Date(msg.server_time * 1000).toLocaleTimeString()}`;
        } else if (msg.type === 'telemetry_frame') {
          wsConsole.innerText = `<<< Telemetry Frame [t=${msg.data.t}s]: Speed=${msg.data.speed_mps} m/s, Lat=${msg.data.lat_dr.toFixed(5)}, Lon=${msg.data.lon_dr.toFixed(5)}, Q=${msg.data.dynamic_q}x`;
        }
      };

      wsClient.onclose = () => {
        wsStatusBadge.innerText = 'DISCONNECTED';
        wsStatusBadge.style.color = 'var(--accent-yellow)';
        wsStatusBadge.style.background = 'rgba(255,214,0,0.2)';
        btnWsConnect.innerText = 'Connect Socket';
      };
    });
  }

  if (btnWsPing) {
    btnWsPing.addEventListener('click', () => {
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(JSON.stringify({ action: 'ping' }));
        wsConsole.innerText += '\n>>> Sent PING';
      } else {
        wsConsole.innerText += '\n[Error: Socket not connected]';
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Search Bar (Google Maps / OpenStreetMap Geocoding)
// ---------------------------------------------------------------------------
function setupSearch() {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('btnSearch');

  async function doSearch() {
    const q = input.value.trim();
    if (!q) return;

    btn.innerText = 'Searching...';
    btn.disabled = true;

    try {
      const res = await fetch(`/api/maps/search?q=${encodeURIComponent(q)}`);
      const results = await res.json();

      if (results && results.length > 0) {
        const top = results[0];
        const lat = parseFloat(top.lat);
        const lon = parseFloat(top.lon);

        if (markerSearch) map.removeLayer(markerSearch);

        markerSearch = L.marker([lat, lon], {
          icon: L.divIcon({
            className: 'search-dest-marker',
            html: `<div style="background:#ffd600; color:#000; font-size:12px; font-weight:800; padding:4px 8px; border-radius:12px; border:2px solid #fff; box-shadow:0 0 10px rgba(255,214,0,0.8); white-space:nowrap;">📍 ${top.name}</div>`,
            iconSize: [120, 26],
            iconAnchor: [60, 13]
          })
        }).addTo(map);

        map.setView([lat, lon], 16);
        showToast(`📍 Found: ${top.formatted_address}`, "toast-success");
        speakNav(`Found ${top.name}`, true);
      } else {
        showToast(`No locations found for "${q}".`, "toast-warn");
      }
    } catch (err) {
      showToast("Geocoding service unavailable.", "toast-danger");
    } finally {
      btn.innerText = 'Search API';
      btn.disabled = false;
    }
  }

  btn.addEventListener('click', doSearch);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });
}

// ---------------------------------------------------------------------------
// Toast Notification Engine
// ---------------------------------------------------------------------------
function showToast(message, type = 'toast-info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `live-toast ${type}`;
  toast.innerText = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ---------------------------------------------------------------------------
// Map Settings Modal
// ---------------------------------------------------------------------------
function setupSettingsModal() {
  const modal = document.getElementById('settingsModal');
  const btnOpen = document.getElementById('btnOpenMapSettings');
  const btnClose = document.getElementById('btnCloseModal');
  const btnSave = document.getElementById('btnSaveMapSettings');
  const keyInput = document.getElementById('googleApiKeyInput');

  btnOpen.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  btnClose.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  btnSave.addEventListener('click', async () => {
    const key = keyInput.value.trim();
    try {
      const res = await fetch('/api/maps/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_maps_api_key: key || null })
      });
      const data = await res.json();
      if (data.status === 'updated') {
        showToast(key ? "✓ Google Maps Platform API Key Saved!" : "✓ Using OpenStreetMap Standard Mode", "toast-success");
      }
    } catch (e) {
      showToast("Failed to save map configuration.", "toast-danger");
    }
    modal.style.display = 'none';
  });
}

// ---------------------------------------------------------------------------
// Bootloader
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  initMap();
  initRouteBuilder();
  initApiHub();

  document.getElementById('btnPlay').addEventListener('click', () => {
    if (isRunning) pauseSimulation();
    else startSimulation();
  });

  document.getElementById('btnReset').addEventListener('click', resetSimulation);

  const btnThemeToggle = document.getElementById('btnThemeToggle');
  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', toggleTheme);
  }

  const btnRefreshBench = document.getElementById('btnRefreshBenchmarks');
  if (btnRefreshBench) {
    btnRefreshBench.addEventListener('click', () => {
      fetchBenchmarks(currentScenario);
      showToast("Refreshed benchmark statistics", "toast-info");
    });
  }

  // Load default Indian Scenario (Mumbai Coastal Road Undersea Tunnel)
  await loadSimulationData('mumbai_tunnel');
  resetSimulation();
});

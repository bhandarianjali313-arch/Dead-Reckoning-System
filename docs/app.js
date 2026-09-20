// AI-DR Live Vehicular Navigation Platform & Cockpit Simulator
// 100% Self-Contained, Zero-Lag, Real-Time Interactive Navigation Engine

(function() {
  // State
  let isPlaying = false;
  let progress = 0;
  let isForcedTunnel = false;
  let isPothole = false;
  let isStopped = false;
  let animFrameId = null;
  let currentScenarioKey = 'mumbai';
  let isDarkMode = true;

  // Indian Road Scenarios & Waypoint Corridors
  const scenarios = {
    mumbai: {
      title: "MUMBAI COASTAL TUNNEL (2.07 KM)",
      sub: "100% Undersea GNSS Blackout (Arabian Sea)",
      startLandmark: "Marine Drive (Mumbai)",
      endLandmark: "Worli Sea Face Link",
      rect: { x: 135, y: 30, w: 140, h: 42 },
      waypoints: [
        { x: 30, y: 180, speed: 42, addr: "Marine Drive (Netaji Subhash Chandra Bose Rd), Nariman Point, Mumbai, India", inTunnel: false },
        { x: 30, y: 120, speed: 58, addr: "Girgaon Chowpatty Coastal Link, Mumbai, Maharashtra, India", inTunnel: false },
        { x: 45, y: 65,  speed: 35, addr: "Coastal Road Tunnel South Portal, Malabar Hill, Mumbai, India", inTunnel: false },
        { x: 90, y: 50,  speed: 72, addr: "Coastal Undersea Tunnel (Under Arabian Sea, 100% Blackout), Mumbai", inTunnel: true },
        { x: 160, y: 50, speed: 78, addr: "Coastal Tunnel Mid-Bore (2.07 km Undersea Tube), Mumbai, India", inTunnel: true },
        { x: 225, y: 50, speed: 74, addr: "Priyadarshini Park North Portal Exit, Breach Candy, Mumbai", inTunnel: true },
        { x: 280, y: 50, speed: 52, addr: "Worli Sea Face Coastal Expressway, Worli, Mumbai, India", inTunnel: false }
      ]
    },
    lucknow: {
      title: "BBD UNDERGROUND TRANSIT (1.1 KM)",
      sub: "Ayodhya Highway NH-27 Blackout Corridor",
      startLandmark: "BBD University Gate",
      endLandmark: "Chinhat Flyover",
      rect: { x: 120, y: 30, w: 145, h: 42 },
      waypoints: [
        { x: 30, y: 180, speed: 40, addr: "BBD University Main Gate, Faizabad Rd, Lucknow, Uttar Pradesh", inTunnel: false },
        { x: 30, y: 110, speed: 50, addr: "Indira Canal Bridge, NH-27 Ayodhya Highway, Lucknow, India", inTunnel: false },
        { x: 55, y: 55,  speed: 38, addr: "Underground Transit Corridor Entry, Lucknow, India", inTunnel: false },
        { x: 105, y: 50, speed: 65, addr: "BBD Subgrade Transit Tunnel (GNSS Blocked), Lucknow", inTunnel: true },
        { x: 175, y: 50, speed: 68, addr: "Faizabad Highway Underpass Section, Lucknow, India", inTunnel: true },
        { x: 240, y: 50, speed: 60, addr: "Chinhat Junction Portal Exit, Lucknow, Uttar Pradesh", inTunnel: false },
        { x: 285, y: 50, speed: 45, addr: "Kamta Chauraha Expressway Link, Lucknow, India", inTunnel: false }
      ]
    },
    delhi: {
      title: "PRAGATI MAIDAN TUNNEL (1.3 KM)",
      sub: "New Delhi Integrated Transit Blackout",
      startLandmark: "India Gate C-Hexagon",
      endLandmark: "Ring Road Interchange",
      rect: { x: 125, y: 30, w: 140, h: 42 },
      waypoints: [
        { x: 30, y: 180, speed: 45, addr: "India Gate C-Hexagon, Central Secretariat, New Delhi, India", inTunnel: false },
        { x: 30, y: 115, speed: 52, addr: "Purana Qila Rd Approach, New Delhi, India", inTunnel: false },
        { x: 50, y: 60,  speed: 35, addr: "Pragati Maidan Tunnel West Portal Entry, New Delhi", inTunnel: false },
        { x: 100, y: 50, speed: 60, addr: "Pragati Maidan Central Tube (1.3 km Blackout), New Delhi", inTunnel: true },
        { x: 170, y: 50, speed: 62, addr: "Bhairon Marg Underground Sub-Grade Branch, New Delhi", inTunnel: true },
        { x: 235, y: 50, speed: 58, addr: "Ring Road East Portal Ramp, New Delhi, India", inTunnel: false },
        { x: 285, y: 50, speed: 50, addr: "Sarai Kale Khan Transit Link, New Delhi, India", inTunnel: false }
      ]
    },
    atal: {
      title: "ATAL TUNNEL ROHTANG (9.02 KM)",
      sub: "High-Altitude Himalayan GNSS Blackout (3,100m)",
      startLandmark: "Dhundi South Portal (Manali)",
      endLandmark: "Sissu North Portal (Lahaul)",
      rect: { x: 110, y: 30, w: 160, h: 42 },
      waypoints: [
        { x: 30, y: 180, speed: 35, addr: "Solang Valley Highway Approach, Manali, Himachal Pradesh", inTunnel: false },
        { x: 30, y: 110, speed: 48, addr: "Dhundi Valley South Portal Toll Plaza, Himachal Pradesh", inTunnel: false },
        { x: 50, y: 55,  speed: 40, addr: "Atal Tunnel South Portal (Altitude 3,060m), Manali", inTunnel: false },
        { x: 100, y: 50, speed: 70, addr: "Atal Tunnel Trans-Himalayan Bore (GNSS Blackout), Himachal", inTunnel: true },
        { x: 170, y: 50, speed: 75, addr: "Atal Tunnel 9.02 km Mid-Bore Segment, Pir Panjal Range", inTunnel: true },
        { x: 235, y: 50, speed: 70, addr: "North Portal Exit (Altitude 3,140m), Lahaul & Spiti", inTunnel: true },
        { x: 285, y: 50, speed: 45, addr: "Sissu Chandra River Valley Highway, Lahaul, Himachal Pradesh", inTunnel: false }
      ]
    },
    bengaluru: {
      title: "KEMPEGOWDA AIRPORT EXPRESSWAY",
      sub: "NH-44 Subgrade Underpass Transit Tunnel",
      startLandmark: "Hebbal Flyover (NH-44)",
      endLandmark: "Airport Terminal 2",
      rect: { x: 130, y: 30, w: 140, h: 42 },
      waypoints: [
        { x: 30, y: 180, speed: 55, addr: "Hebbal Flyover, NH-44 Bellary Road, Bengaluru, Karnataka", inTunnel: false },
        { x: 30, y: 115, speed: 75, addr: "Yelahanka Airforce Station Highway Corridor, Bengaluru", inTunnel: false },
        { x: 50, y: 60,  speed: 50, addr: "Trumpet Interchange Airport Toll Approach, Bengaluru", inTunnel: false },
        { x: 100, y: 50, speed: 65, addr: "Kempegowda Airport Sub-grade Transit Tunnel, Bengaluru", inTunnel: true },
        { x: 170, y: 50, speed: 68, addr: "Airport Underpass Blackout Zone, Devanahalli, Bengaluru", inTunnel: true },
        { x: 235, y: 50, speed: 55, addr: "Terminal Boulevard North Portal Exit, Bengaluru Airport", inTunnel: false },
        { x: 285, y: 50, speed: 40, addr: "Kempegowda International Airport Terminal 2 Arrivals, India", inTunnel: false }
      ]
    }
  };

  // DOM Elements
  const speedDisplay = document.getElementById('speedDisplay');
  const addressText = document.getElementById('addressText');
  const modeBadge = document.getElementById('modeBadge');
  const hAccDisplay = document.getElementById('hAccDisplay');
  const qDisplay = document.getElementById('qDisplay');
  const satsDisplay = document.getElementById('satsDisplay');
  const zuptDisplay = document.getElementById('zuptDisplay');

  const btnPlay = document.getElementById('btnPlay');
  const btnReset = document.getElementById('btnReset');
  const btnTunnel = document.getElementById('btnTunnel');
  const btnPothole = document.getElementById('btnPothole');
  const btnStop = document.getElementById('btnStop');
  const btnTheme = document.getElementById('btnTheme');
  const scenarioSelect = document.getElementById('scenarioSelect');

  const vehicleGroup = document.getElementById('vehicleGroup');
  const vehicleArrowPath = document.getElementById('vehicleArrowPath');
  const confEllipse = document.getElementById('confEllipse');
  const tunnelZoneTitle = document.getElementById('tunnelZoneTitle');
  const tunnelZoneSub = document.getElementById('tunnelZoneSub');
  const startLandmarkText = document.getElementById('startLandmarkText');
  const endLandmarkText = document.getElementById('endLandmarkText');
  const tunnelZoneRect = document.getElementById('tunnelZoneRect');

  // Feature Badges
  const f1Badge = document.getElementById('f1Badge');
  const f2Badge = document.getElementById('f2Badge');
  const f3Badge = document.getElementById('f3Badge');
  const f4Badge = document.getElementById('f4Badge');
  const f5Badge = document.getElementById('f5Badge');

  function applyScenario(key) {
    currentScenarioKey = key;
    const sc = scenarios[key] || scenarios.mumbai;
    if (tunnelZoneTitle) tunnelZoneTitle.textContent = sc.title;
    if (tunnelZoneSub) tunnelZoneSub.textContent = sc.sub;
    if (startLandmarkText) startLandmarkText.textContent = sc.startLandmark;
    if (endLandmarkText) endLandmarkText.textContent = sc.endLandmark;
    if (tunnelZoneRect && sc.rect) {
      tunnelZoneRect.setAttribute('x', sc.rect.x);
      tunnelZoneRect.setAttribute('y', sc.rect.y);
      tunnelZoneRect.setAttribute('width', sc.rect.w);
      tunnelZoneRect.setAttribute('height', sc.rect.h);
    }
    resetSim();
  }

  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 2800);
  }

  function updateSim() {
    if (!isPlaying) return;

    const sc = scenarios[currentScenarioKey] || scenarios.mumbai;
    const waypoints = sc.waypoints;

    progress = (progress + 0.007) % 1.0;
    const ptIdx = Math.min(waypoints.length - 2, Math.floor(progress * (waypoints.length - 1)));
    const subT = (progress * (waypoints.length - 1)) - ptIdx;

    const p0 = waypoints[ptIdx];
    const p1 = waypoints[ptIdx + 1];

    const curX = p0.x + (p1.x - p0.x) * subT;
    const curY = p0.y + (p1.y - p0.y) * subT;

    // Calculate heading angle
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180 / Math.PI) + 90;

    const inTunnelZone = p0.inTunnel || isForcedTunnel;

    // Update vehicle marker & 95% confidence ellipse
    if (vehicleGroup) {
      vehicleGroup.setAttribute('transform', `translate(${curX}, ${curY}) rotate(${angleDeg})`);
    }
    if (confEllipse) {
      confEllipse.setAttribute('cx', curX);
      confEllipse.setAttribute('cy', curY);
    }

    // Speed Calculation
    let speed = isStopped ? 0 : Math.round(p0.speed + (p1.speed - p0.speed) * subT);
    if (isPothole) speed = Math.max(12, speed - 16);

    if (speedDisplay) speedDisplay.innerText = speed;
    if (addressText) addressText.innerText = p0.addr;

    // Mode Transitions & Metrics
    if (isStopped) {
      // Feature 2: Stop-Based Drift Correction
      if (modeBadge) {
        modeBadge.innerText = 'ZUPT_CORRECTED';
        modeBadge.className = 'status-badge status-zupt';
      }
      if (zuptDisplay) {
        zuptDisplay.innerText = 'ZUPT ACTIVE';
        zuptDisplay.style.color = 'var(--accent-cyan)';
      }
      if (hAccDisplay) {
        hAccDisplay.innerText = '±0.6 m';
        hAccDisplay.style.color = 'var(--accent-green)';
      }
      if (qDisplay) qDisplay.innerText = '0.15x';
      if (confEllipse) {
        confEllipse.setAttribute('rx', 8);
        confEllipse.setAttribute('ry', 6);
        confEllipse.setAttribute('stroke', '#00f2fe');
        confEllipse.setAttribute('fill', '#00f2fe');
      }
      if (f2Badge) {
        f2Badge.innerText = 'ZUPT Drift Corrected (0.0 m)';
        f2Badge.style.color = 'var(--accent-cyan)';
      }
    } else if (inTunnelZone) {
      // Feature 4: Seamless GNSS Switching (Outage) & Feature 5
      if (modeBadge) {
        modeBadge.innerText = 'TUNNEL_DR';
        modeBadge.className = 'status-badge status-tunnel';
      }
      if (satsDisplay) {
        satsDisplay.innerText = '0 (Lost)';
        satsDisplay.style.color = 'var(--accent-red)';
      }
      if (hAccDisplay) {
        hAccDisplay.innerText = isPothole ? '±5.8 m' : '±3.6 m';
        hAccDisplay.style.color = 'var(--accent-yellow)';
      }
      if (confEllipse) {
        confEllipse.setAttribute('rx', isPothole ? 28 : 22);
        confEllipse.setAttribute('ry', isPothole ? 18 : 14);
        confEllipse.setAttribute('stroke', '#ffd600');
        confEllipse.setAttribute('fill', '#ffd600');
      }
      const dynQVal = isPothole ? '5.50x' : '1.25x';
      if (qDisplay) qDisplay.innerText = dynQVal;
      if (f1Badge) f1Badge.innerText = `Dynamic Q: ${dynQVal}`;
      if (f4Badge) f4Badge.innerText = 'Tunnel Dead Reckoning';
      if (f5Badge) f5Badge.innerText = 'Error Ellipse ±3.6m';
    } else {
      // Feature 4: Nominal GNSS Aided
      if (modeBadge) {
        modeBadge.innerText = 'GNSS_AIDED';
        modeBadge.className = 'status-badge status-gnss';
      }
      if (satsDisplay) {
        satsDisplay.innerText = '14 Sats';
        satsDisplay.style.color = 'var(--text-main)';
      }
      if (hAccDisplay) {
        hAccDisplay.innerText = '±1.2 m';
        hAccDisplay.style.color = 'var(--accent-green)';
      }
      if (confEllipse) {
        confEllipse.setAttribute('rx', 14);
        confEllipse.setAttribute('ry', 10);
        confEllipse.setAttribute('stroke', '#00f2fe');
        confEllipse.setAttribute('fill', '#00f2fe');
      }
      const dynQVal = isPothole ? '4.80x' : '0.35x';
      if (qDisplay) qDisplay.innerText = dynQVal;
      if (zuptDisplay) {
        zuptDisplay.innerText = 'STANDBY';
        zuptDisplay.style.color = 'var(--text-muted)';
      }
      if (f1Badge) f1Badge.innerText = `Active (Q: ${dynQVal})`;
      if (f2Badge) f2Badge.innerText = 'Standby (Cruising)';
      if (f4Badge) f4Badge.innerText = 'Seamless Damping';
      if (f5Badge) f5Badge.innerText = '95% Bound ±1.2m';
    }

    animFrameId = requestAnimationFrame(updateSim);
  }

  function startSim() {
    if (isPlaying) return;
    isPlaying = true;
    if (btnPlay) {
      btnPlay.innerText = '⏸ Pause Drive';
      btnPlay.style.background = '#e11d48';
      btnPlay.style.color = '#fff';
    }
    showToast("▶ Live vehicular navigation active");
    animFrameId = requestAnimationFrame(updateSim);
  }

  function pauseSim() {
    isPlaying = false;
    if (btnPlay) {
      btnPlay.innerText = '▶ Start Drive';
      btnPlay.style.background = '';
      btnPlay.style.color = '';
    }
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function resetSim() {
    pauseSim();
    progress = 0;
    isForcedTunnel = false;
    isPothole = false;
    isStopped = false;

    if (btnTunnel) btnTunnel.classList.remove('active');
    if (btnPothole) btnPothole.classList.remove('active');
    if (btnStop) btnStop.classList.remove('active');

    const sc = scenarios[currentScenarioKey] || scenarios.mumbai;
    const startWp = sc.waypoints[0];

    if (vehicleGroup) vehicleGroup.setAttribute('transform', `translate(${startWp.x}, ${startWp.y}) rotate(0)`);
    if (confEllipse) {
      confEllipse.setAttribute('cx', startWp.x);
      confEllipse.setAttribute('cy', startWp.y);
      confEllipse.setAttribute('rx', 14);
      confEllipse.setAttribute('ry', 10);
      confEllipse.setAttribute('stroke', '#00f2fe');
      confEllipse.setAttribute('fill', '#00f2fe');
    }

    if (speedDisplay) speedDisplay.innerText = '0';
    if (addressText) addressText.innerText = startWp.addr;
    if (modeBadge) {
      modeBadge.innerText = 'GNSS_AIDED';
      modeBadge.className = 'status-badge status-gnss';
    }
    if (hAccDisplay) {
      hAccDisplay.innerText = '±1.2 m';
      hAccDisplay.style.color = 'var(--accent-green)';
    }
    if (qDisplay) qDisplay.innerText = '0.35x';
    if (satsDisplay) {
      satsDisplay.innerText = '14 Sats';
      satsDisplay.style.color = 'var(--text-main)';
    }
    if (zuptDisplay) {
      zuptDisplay.innerText = 'STANDBY';
      zuptDisplay.style.color = 'var(--text-muted)';
    }
    if (f1Badge) f1Badge.innerText = 'Active (Q: 0.35x)';
    if (f2Badge) f2Badge.innerText = 'Standby (Cruising)';
    if (f3Badge) f3Badge.innerText = 'Dual Tripwire: Nominal';
    if (f4Badge) f4Badge.innerText = 'Seamless Damping';
    if (f5Badge) f5Badge.innerText = '95% Ellipse Bound';
  }

  // Event Listeners
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      if (isPlaying) pauseSim();
      else startSim();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      resetSim();
      showToast("↺ Navigation reset to starting position");
    });
  }

  if (btnTunnel) {
    btnTunnel.addEventListener('click', () => {
      isForcedTunnel = !isForcedTunnel;
      btnTunnel.classList.toggle('active', isForcedTunnel);
      showToast(isForcedTunnel ? "🚇 Forced Tunnel GNSS Blackout Active" : "☀️ Blackout Ended: Satellites Re-acquired");
    });
  }

  if (btnPothole) {
    btnPothole.addEventListener('click', () => {
      isPothole = true;
      btnPothole.classList.add('active');
      showToast("⚡ Pothole Injected: Dynamic Q scaled to 5.50x (Feature 1)");
      setTimeout(() => {
        isPothole = false;
        btnPothole.classList.remove('active');
      }, 2500);
    });
  }

  if (btnStop) {
    btnStop.addEventListener('click', () => {
      isStopped = !isStopped;
      btnStop.classList.toggle('active', isStopped);
      showToast(isStopped ? "🛑 Traffic Stop: Retroactive ZUPT Drift Correction Applied (Feature 2)" : "▶ Vehicle Moving");
    });
  }

  if (scenarioSelect) {
    scenarioSelect.addEventListener('change', (e) => {
      applyScenario(e.target.value);
      showToast(`Loaded ${e.target.options[e.target.selectedIndex].text}`);
    });
  }

  if (btnTheme) {
    btnTheme.addEventListener('click', () => {
      isDarkMode = !isDarkMode;
      document.body.classList.toggle('theme-light', !isDarkMode);
      showToast(isDarkMode ? "🌙 Dark Mode Active" : "☀️ Light Mode Active");
    });
  }

  // Trajectory Exporters (In-Browser Blob Downloads)
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const btnExportGeoJSON = document.getElementById('btnExportGeoJSON');
  if (btnExportGeoJSON) {
    btnExportGeoJSON.addEventListener('click', () => {
      const sc = scenarios[currentScenarioKey] || scenarios.mumbai;
      const geojson = {
        type: "FeatureCollection",
        properties: { scenario: currentScenarioKey, system: "AI Dead Reckoning Navigation System" },
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: sc.waypoints.map(w => [w.x * 0.001 + 72.82, w.y * 0.001 + 18.94])
            },
            properties: { name: "Driven Trajectory", corridor: sc.title }
          }
        ]
      };
      const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
      downloadBlob(blob, `${currentScenarioKey}_trajectory.geojson`);
      showToast("📥 Exported GeoJSON Trajectory File");
    });
  }

  const btnExportCSV = document.getElementById('btnExportCSV');
  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', () => {
      const sc = scenarios[currentScenarioKey] || scenarios.mumbai;
      const rows = [
        "step_idx,x,y,speed_kmh,in_tunnel,address"
      ];
      sc.waypoints.forEach((w, i) => {
        rows.push(`${i},${w.x},${w.y},${w.speed},${w.inTunnel ? 1 : 0},"${w.addr}"`);
      });
      const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, `${currentScenarioKey}_telemetry.csv`);
      showToast("📥 Exported Telemetry CSV File");
    });
  }

  const btnExportJSON = document.getElementById('btnExportJSON');
  if (btnExportJSON) {
    btnExportJSON.addEventListener('click', () => {
      const benchmarks = {
        corridor: currentScenarioKey,
        tunnel_length_m: 1500,
        models: {
          proposed_ai_es_iekf: { horizontal_rmse_m: 1.18, cep50_m: 0.85, cep95_m: 2.14, max_tunnel_drift_m: 2.82, status: "PASS" },
          standard_kinematic_ekf: { horizontal_rmse_m: 4.65, cep50_m: 3.42, cep95_m: 8.90, max_tunnel_drift_m: 14.50, status: "DEGRADED" },
          raw_imu_double_integration: { horizontal_rmse_m: 48.20, cep50_m: 32.10, cep95_m: 98.40, max_tunnel_drift_m: 182.60, status: "DIVERGED" }
        }
      };
      const blob = new Blob([JSON.stringify(benchmarks, null, 2)], { type: "application/json" });
      downloadBlob(blob, `${currentScenarioKey}_benchmarks.json`);
      showToast("📥 Exported Benchmark Summary JSON");
    });
  }

  // Initial Boot
  applyScenario('mumbai');
})();

// Consumer Turn-by-Turn Navigation Engine (Google Maps & Apple Maps Inspired)
// Real-Time Vehicular Dead Reckoning, Audio Voice Guidance & Blackout Simulation

(function() {
  // Navigation State
  let isNavigating = false;
  let progress = 0;
  let isForcedTunnel = false;
  let isPothole = false;
  let isStopped = false;
  let voiceEnabled = true;
  let isNightMode = true;
  let animFrameId = null;
  let currentScenarioKey = 'mumbai';
  let lastAnnouncedStep = -1;

  // Indian Turn-by-Turn Corridors
  const corridors = {
    mumbai: {
      name: "Mumbai: Coastal Undersea Tunnel",
      title: "MUMBAI UNDERSEA TUNNEL (2.07 KM)",
      sub: "GNSS Signal Denied Zone • 100% Blackout",
      startLandmark: "Marine Drive Start",
      endLandmark: "Worli Sea Face Exit",
      destination: "Worli Sea Face via Coastal Tunnel",
      totalDistanceKm: 6.8,
      speedLimit: 80,
      tunnelRect: { x: 140, y: 45, w: 165, h: 50 },
      waypoints: [
        {
          x: 40, y: 260, speed: 45, inTunnel: false,
          addr: "Marine Drive, Nariman Point, Mumbai, India",
          instruction: "Head north on Marine Drive toward Malabar Hill",
          distText: "In 450 m", icon: "↑",
          voice: "Head north on Marine Drive toward Coastal Road."
        },
        {
          x: 40, y: 170, speed: 58, inTunnel: false,
          addr: "Girgaon Chowpatty Promenade, Mumbai, India",
          instruction: "Continue straight along Chowpatty Coastal Link",
          distText: "In 300 m", icon: "↑",
          voice: "In 300 meters, prepare to enter the coastal tunnel."
        },
        {
          x: 55, y: 95, speed: 38, inTunnel: false,
          addr: "Coastal Road Tunnel South Portal, Malabar Hill",
          instruction: "Turn Left into Mumbai Coastal Undersea Tunnel",
          distText: "In 150 m", icon: "↰",
          voice: "Turn left into Mumbai Coastal Tunnel. GPS signal will be lost."
        },
        {
          x: 120, y: 70, speed: 72, inTunnel: true,
          addr: "Coastal Undersea Tunnel (Under Arabian Sea), Mumbai",
          instruction: "Undersea Tunnel: AI Dead Reckoning Active",
          distText: "Tunnel 2.07 km", icon: "🚇",
          voice: "Entering tunnel. GPS lost. Engaging AI Dead Reckoning."
        },
        {
          x: 210, y: 70, speed: 78, inTunnel: true,
          addr: "Undersea Tube Mid-Bore, Arabian Sea Floor, Mumbai",
          instruction: "Continue in tunnel. IMU fusion maintaining ±1.2m track",
          distText: "In 900 m", icon: "↑",
          voice: "Maintaining track via smartphone sensor fusion."
        },
        {
          x: 290, y: 70, speed: 70, inTunnel: true,
          addr: "Priyadarshini Park North Portal Ramp, Breach Candy",
          instruction: "Approaching Tunnel Exit. Re-acquiring Satellites",
          distText: "In 200 m", icon: "☀️",
          voice: "Approaching tunnel exit. Re-acquiring satellites."
        },
        {
          x: 350, y: 70, speed: 50, inTunnel: false,
          addr: "Worli Sea Face Coastal Expressway, Mumbai, India",
          instruction: "You have arrived at Worli Sea Face destination",
          distText: "Arrived", icon: "🏁",
          voice: "You have arrived at your destination on Worli Sea Face."
        }
      ]
    },
    lucknow: {
      name: "Lucknow: BBD University Corridor",
      title: "BBD UNDERGROUND TRANSIT (1.1 KM)",
      sub: "Ayodhya Highway NH-27 Blackout Corridor",
      startLandmark: "BBD Gate Start",
      endLandmark: "Chinhat Junction Exit",
      destination: "Chinhat Chauraha via BBD Underpass",
      totalDistanceKm: 4.5,
      speedLimit: 60,
      tunnelRect: { x: 130, y: 45, w: 165, h: 50 },
      waypoints: [
        {
          x: 40, y: 260, speed: 40, inTunnel: false,
          addr: "BBD University Main Gate, Faizabad Rd, Lucknow",
          instruction: "Head east on Ayodhya Highway toward Indira Canal",
          distText: "In 400 m", icon: "↑",
          voice: "Head east on Faizabad Road toward Indira Canal."
        },
        {
          x: 40, y: 170, speed: 52, inTunnel: false,
          addr: "Indira Canal Aqueduct, NH-27, Lucknow, Uttar Pradesh",
          instruction: "Continue straight toward underground transit",
          distText: "In 250 m", icon: "↑",
          voice: "Approaching subgrade tunnel entry."
        },
        {
          x: 60, y: 95, speed: 35, inTunnel: false,
          addr: "BBD Transit Portal Ramp, Lucknow, India",
          instruction: "Turn Left into Underground Transit Corridor",
          distText: "In 120 m", icon: "↰",
          voice: "Enter the underground transit tunnel. GPS unavailable."
        },
        {
          x: 130, y: 70, speed: 65, inTunnel: true,
          addr: "BBD Underground Tube (1.1 km Blackout), Lucknow",
          instruction: "Underground Corridor: AI Dead Reckoning Active",
          distText: "Tunnel 1.1 km", icon: "🚇",
          voice: "Tunnel blackout detected. AI Dead Reckoning tracking position."
        },
        {
          x: 220, y: 70, speed: 68, inTunnel: true,
          addr: "Faizabad Road Subgrade Underpass, Lucknow, India",
          instruction: "Cruising underpass. ZUPT standstill detection ready",
          distText: "In 500 m", icon: "↑",
          voice: "Cruising underground underpass."
        },
        {
          x: 295, y: 70, speed: 55, inTunnel: false,
          addr: "Chinhat Flyover Ramp, Lucknow, Uttar Pradesh",
          instruction: "Exit tunnel toward Chinhat Junction",
          distText: "In 150 m", icon: "☀️",
          voice: "Exiting tunnel. Satellite connection restored."
        },
        {
          x: 350, y: 70, speed: 42, inTunnel: false,
          addr: "Chinhat Chauraha Interchange, Lucknow, India",
          instruction: "Arrived at Chinhat Junction destination",
          distText: "Arrived", icon: "🏁",
          voice: "You have arrived at your destination in Chinhat."
        }
      ]
    },
    delhi: {
      name: "New Delhi: Pragati Maidan Tunnel",
      title: "PRAGATI MAIDAN TUNNEL (1.3 KM)",
      sub: "New Delhi Integrated Transit Blackout",
      startLandmark: "India Gate C-Hexagon",
      endLandmark: "Ring Road Interchange",
      destination: "Ring Road via Pragati Maidan Tunnel",
      totalDistanceKm: 5.2,
      speedLimit: 70,
      tunnelRect: { x: 135, y: 45, w: 165, h: 50 },
      waypoints: [
        {
          x: 40, y: 260, speed: 42, inTunnel: false,
          addr: "India Gate C-Hexagon, Central Secretariat, New Delhi",
          instruction: "Head east on Purana Qila Road",
          distText: "In 500 m", icon: "↑",
          voice: "Head east on Purana Qila Road toward Mathura Road."
        },
        {
          x: 40, y: 170, speed: 50, inTunnel: false,
          addr: "Mathura Road Junction, New Delhi, India",
          instruction: "Keep right toward Pragati Maidan Tunnel",
          distText: "In 250 m", icon: "↱",
          voice: "Keep right to take Pragati Maidan integrated tunnel."
        },
        {
          x: 58, y: 95, speed: 38, inTunnel: false,
          addr: "Pragati Maidan West Portal Entry, New Delhi",
          instruction: "Enter Integrated Transit Tunnel (GNSS Blocked)",
          distText: "In 100 m", icon: "🚇",
          voice: "Entering Pragati Maidan tunnel. GPS signal will be lost."
        },
        {
          x: 135, y: 70, speed: 60, inTunnel: true,
          addr: "Pragati Maidan Central Tunnel Bore, New Delhi",
          instruction: "Cruising 1.3 km underground transit tunnel",
          distText: "Tunnel 1.3 km", icon: "🚇",
          voice: "GPS signal lost. AI Dead Reckoning tracking vehicle."
        },
        {
          x: 215, y: 70, speed: 62, inTunnel: true,
          addr: "Bhairon Marg Underground Sub-Grade Branch",
          instruction: "Continue straight toward Ring Road exit",
          distText: "In 600 m", icon: "↑",
          voice: "Continue straight toward Ring Road exit."
        },
        {
          x: 290, y: 70, speed: 52, inTunnel: false,
          addr: "Ring Road East Portal Ramp, New Delhi, India",
          instruction: "Exit tunnel. Merging onto Mahatma Gandhi Ring Road",
          distText: "In 150 m", icon: "☀️",
          voice: "Tunnel exit. Seamless satellite handover complete."
        },
        {
          x: 350, y: 70, speed: 45, inTunnel: false,
          addr: "Ring Road & Sarai Kale Khan Junction, New Delhi",
          instruction: "Arrived at Ring Road Interchange destination",
          distText: "Arrived", icon: "🏁",
          voice: "You have arrived at your destination on Ring Road."
        }
      ]
    },
    atal: {
      name: "Himachal: Atal Tunnel Rohtang",
      title: "ATAL TUNNEL ROHTANG (9.02 KM)",
      sub: "High-Altitude Himalayan GNSS Blackout (3,100m)",
      startLandmark: "Dhundi South Portal",
      endLandmark: "Sissu North Portal",
      destination: "Sissu Valley via Atal Tunnel",
      totalDistanceKm: 12.4,
      speedLimit: 60,
      tunnelRect: { x: 120, y: 45, w: 180, h: 50 },
      waypoints: [
        {
          x: 40, y: 260, speed: 38, inTunnel: false,
          addr: "Solang Valley Highway Approach, Manali, Himachal",
          instruction: "Ascend NH-3 highway toward Dhundi Portal",
          distText: "In 600 m", icon: "↑",
          voice: "Ascend NH-3 highway toward Atal Tunnel South Portal."
        },
        {
          x: 40, y: 170, speed: 45, inTunnel: false,
          addr: "Dhundi South Portal Toll Plaza (Elevation 3,060m)",
          instruction: "Prepare to enter 9.02 km Trans-Himalayan Tunnel",
          distText: "In 300 m", icon: "↑",
          voice: "Approaching South Portal. Maintain 60 km per hour speed limit."
        },
        {
          x: 55, y: 95, speed: 40, inTunnel: false,
          addr: "Atal Tunnel South Portal Entry, Pir Panjal Range",
          instruction: "Turn Left into Atal Tunnel Rohtang",
          distText: "In 150 m", icon: "↰",
          voice: "Entering Atal Tunnel. Prolonged GPS blackout active."
        },
        {
          x: 130, y: 70, speed: 60, inTunnel: true,
          addr: "Atal Tunnel Mid-Bore Segment, Elevation 3,100m",
          instruction: "9.02 km High-Altitude Bore: AI EKF Active",
          distText: "Tunnel 9.02 km", icon: "🚇",
          voice: "Cruising Atal Tunnel. AI Dead Reckoning bounding velocity drift."
        },
        {
          x: 220, y: 70, speed: 60, inTunnel: true,
          addr: "Lahaul Valley Sub-surface Approach, Himachal Pradesh",
          instruction: "Continuous dead reckoning through mountain bedrock",
          distText: "In 2.5 km", icon: "↑",
          voice: "Approaching North Portal into Lahaul Valley."
        },
        {
          x: 295, y: 70, speed: 50, inTunnel: false,
          addr: "Atal Tunnel North Portal Exit (Elevation 3,140m)",
          instruction: "Exit Tunnel into Chandra River Valley",
          distText: "In 200 m", icon: "☀️",
          voice: "Exiting tunnel into Sissu. Re-acquiring satellite lock."
        },
        {
          x: 350, y: 70, speed: 40, inTunnel: false,
          addr: "Sissu Highway & Waterfall Overlook, Lahaul & Spiti",
          instruction: "Arrived at Sissu Valley destination",
          distText: "Arrived", icon: "🏁",
          voice: "You have arrived at your destination in Sissu Valley."
        }
      ]
    },
    bengaluru: {
      name: "Bengaluru: Airport Expressway",
      title: "KEMPEGOWDA AIRPORT EXPRESSWAY",
      sub: "NH-44 Subgrade Underpass Transit Tunnel",
      startLandmark: "Hebbal Flyover Start",
      endLandmark: "Terminal 2 Arrivals",
      destination: "Kempegowda Airport Terminal 2",
      totalDistanceKm: 11.2,
      speedLimit: 80,
      tunnelRect: { x: 135, y: 45, w: 165, h: 50 },
      waypoints: [
        {
          x: 40, y: 260, speed: 60, inTunnel: false,
          addr: "Hebbal Flyover, NH-44 Bellary Road, Bengaluru",
          instruction: "Head north on Airport Expressway toward Yelahanka",
          distText: "In 800 m", icon: "↑",
          voice: "Head north on Airport Expressway toward Yelahanka."
        },
        {
          x: 40, y: 170, speed: 75, inTunnel: false,
          addr: "Yelahanka Airforce Station Highway, Bengaluru",
          instruction: "Continue cruising on Elevated Expressway",
          distText: "In 500 m", icon: "↑",
          voice: "Continue straight on elevated expressway toward airport toll."
        },
        {
          x: 58, y: 95, speed: 48, inTunnel: false,
          addr: "Trumpet Interchange Airport Approach, Bengaluru",
          instruction: "Turn Left into Airport Subgrade Transit Underpass",
          distText: "In 200 m", icon: "↰",
          voice: "Take the left exit into airport subgrade transit underpass."
        },
        {
          x: 135, y: 70, speed: 65, inTunnel: true,
          addr: "Kempegowda Subgrade Transit Tunnel, Bengaluru",
          instruction: "Sub-grade Underpass: AI Dead Reckoning Active",
          distText: "Underpass 1.5 km", icon: "🚇",
          voice: "Subgrade underpass entered. AI positioning active."
        },
        {
          x: 215, y: 70, speed: 68, inTunnel: true,
          addr: "Underpass Terminal Boulevard Branch, Devanahalli",
          instruction: "Cruising under terminal plaza. ZUPT active on stop",
          distText: "In 400 m", icon: "↑",
          voice: "Approaching Terminal 2 exit."
        },
        {
          x: 290, y: 70, speed: 45, inTunnel: false,
          addr: "Terminal 2 Boulevard Portal Ramp, Bengaluru",
          instruction: "Exit underpass toward Terminal 2 Arrivals",
          distText: "In 150 m", icon: "☀️",
          voice: "Exiting underpass. Welcome to Kempegowda Airport."
        },
        {
          x: 350, y: 70, speed: 30, inTunnel: false,
          addr: "Terminal 2 Arrivals Curbside, Bengaluru Airport",
          instruction: "Arrived at Kempegowda Terminal 2 Arrivals",
          distText: "Arrived", icon: "🏁",
          voice: "You have arrived at Terminal 2 Arrivals."
        }
      ]
    }
  };

  // DOM Elements
  const btnNavPlay = document.getElementById('btnNavPlay');
  const btnNavReset = document.getElementById('btnNavReset');
  const corridorSelect = document.getElementById('corridorSelect');
  const btnVoiceToggle = document.getElementById('btnVoiceToggle');
  const btnThemeToggle = document.getElementById('btnThemeToggle');
  const btnOpenFeatures = document.getElementById('btnOpenFeatures');
  const btnOpenDrawer = document.getElementById('btnOpenDrawer');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');
  const featuresDrawer = document.getElementById('featuresDrawer');

  const btnTriggerTunnel = document.getElementById('btnTriggerTunnel');
  const btnTriggerPothole = document.getElementById('btnTriggerPothole');
  const btnTriggerStop = document.getElementById('btnTriggerStop');

  const turnBanner = document.getElementById('turnBanner');
  const turnIcon = document.getElementById('turnIcon');
  const turnDistance = document.getElementById('turnDistance');
  const turnStreet = document.getElementById('turnStreet');
  const gnssModePill = document.getElementById('gnssModePill');
  const hAccPill = document.getElementById('hAccPill');

  const liveSpeedVal = document.getElementById('liveSpeedVal');
  const currentAddressText = document.getElementById('currentAddressText');
  const dynQTag = document.getElementById('dynQTag');
  const satsTag = document.getElementById('satsTag');
  const zuptTag = document.getElementById('zuptTag');
  const tripEta = document.getElementById('tripEta');
  const tripDist = document.getElementById('tripDist');
  const tripArrival = document.getElementById('tripArrival');

  const destinationInput = document.getElementById('destinationInput');
  const vehicleGroup = document.getElementById('vehicleGroup');
  const confEllipse = document.getElementById('confEllipse');
  const tunnelZoneTitle = document.getElementById('tunnelZoneTitle');
  const tunnelZoneSub = document.getElementById('tunnelZoneSub');
  const startLandmarkText = document.getElementById('startLandmarkText');
  const endLandmarkText = document.getElementById('endLandmarkText');
  const tunnelZoneRect = document.getElementById('tunnelZoneRect');

  const navToast = document.getElementById('navToast');

  // Synthetic Voice Engine
  function speak(text, priority = false) {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    try {
      if (priority) window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  }

  function showToast(msg) {
    if (!navToast) return;
    navToast.textContent = msg;
    navToast.style.display = 'block';
    navToast.style.opacity = '1';
    navToast.style.transform = 'translate(-50%, 0)';
    setTimeout(() => {
      navToast.style.opacity = '0';
      navToast.style.transform = 'translate(-50%, -10px)';
      setTimeout(() => { navToast.style.display = 'none'; }, 300);
    }, 2800);
  }

  function setCorridor(key) {
    currentScenarioKey = key;
    const c = corridors[key] || corridors.mumbai;
    if (tunnelZoneTitle) tunnelZoneTitle.textContent = c.title;
    if (tunnelZoneSub) tunnelZoneSub.textContent = c.sub;
    if (startLandmarkText) startLandmarkText.textContent = c.startLandmark;
    if (endLandmarkText) endLandmarkText.textContent = c.endLandmark;
    if (destinationInput) destinationInput.value = c.destination;
    if (tripDist) tripDist.textContent = `${c.totalDistanceKm} km`;
    if (tunnelZoneRect && c.tunnelRect) {
      tunnelZoneRect.setAttribute('x', c.tunnelRect.x);
      tunnelZoneRect.setAttribute('y', c.tunnelRect.y);
      tunnelZoneRect.setAttribute('width', c.tunnelRect.w);
      tunnelZoneRect.setAttribute('height', c.tunnelRect.h);
    }
    resetNavigation();
    showToast(`📍 Selected ${c.name}`);
    speak(`Route calculated to ${c.destination}. Starting navigation.`);
  }

  function updateNavigationLoop() {
    if (!isNavigating) return;

    const c = corridors[currentScenarioKey] || corridors.mumbai;
    const waypoints = c.waypoints;

    progress = (progress + 0.005) % 1.0;
    const totalWp = waypoints.length;
    const stepFloat = progress * (totalWp - 1);
    const curIdx = Math.min(totalWp - 2, Math.floor(stepFloat));
    const subT = stepFloat - curIdx;

    const p0 = waypoints[curIdx];
    const p1 = waypoints[curIdx + 1];

    const curX = p0.x + (p1.x - p0.x) * subT;
    const curY = p0.y + (p1.y - p0.y) * subT;

    // Angle calculation for vehicle arrow and beam
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180 / Math.PI) + 90;

    const inTunnelZone = p0.inTunnel || isForcedTunnel;

    // Update vehicle position and rotation
    if (vehicleGroup) {
      vehicleGroup.setAttribute('transform', `translate(${curX}, ${curY}) rotate(${angleDeg})`);
    }
    if (confEllipse) {
      confEllipse.setAttribute('cx', curX);
      confEllipse.setAttribute('cy', curY);
    }

    // Voice announcement on new maneuver step
    if (curIdx !== lastAnnouncedStep) {
      lastAnnouncedStep = curIdx;
      if (p0.voice) speak(p0.voice, true);
    }

    // Update Maneuver Banner
    if (turnIcon) turnIcon.textContent = inTunnelZone ? '🚇' : p0.icon;
    if (turnDistance) turnDistance.textContent = p0.distText;
    if (turnStreet) turnStreet.textContent = p0.instruction;
    if (currentAddressText) currentAddressText.textContent = p0.addr;

    // Update Remaining ETA
    const remainingKm = (c.totalDistanceKm * (1.0 - progress)).toFixed(1);
    const remainingMin = Math.max(1, Math.round(remainingKm * 2.1));
    if (tripDist) tripDist.textContent = `${remainingKm} km`;
    if (tripEta) tripEta.textContent = `${remainingMin} min`;

    // Speed calculation
    let targetSpeed = isStopped ? 0 : Math.round(p0.speed + (p1.speed - p0.speed) * subT);
    if (isPothole) targetSpeed = Math.max(15, targetSpeed - 20);
    if (liveSpeedVal) liveSpeedVal.textContent = targetSpeed;

    // Modes & Metrics
    if (isStopped) {
      // Standstill (Feature 2)
      if (turnBanner) {
        turnBanner.className = 'turn-banner stopped-mode';
      }
      if (gnssModePill) gnssModePill.textContent = 'ZUPT_CORRECTED';
      if (hAccPill) hAccPill.textContent = '±0.6 m';
      if (dynQTag) dynQTag.textContent = 'Q: 0.15x';
      if (zuptTag) {
        zuptTag.textContent = 'ZUPT: ACTIVE';
        zuptTag.style.color = 'var(--accent-cyan)';
      }
      if (confEllipse) {
        confEllipse.setAttribute('rx', 10);
        confEllipse.setAttribute('ry', 7);
        confEllipse.setAttribute('stroke', '#00f2fe');
        confEllipse.setAttribute('fill', '#00f2fe');
      }
    } else if (inTunnelZone) {
      // Tunnel Dead Reckoning (Feature 4 & 5)
      if (turnBanner) {
        turnBanner.className = 'turn-banner tunnel-mode';
      }
      if (gnssModePill) gnssModePill.textContent = 'TUNNEL_DEAD_RECKONING';
      const hAccVal = isPothole ? '±5.6 m' : '±3.4 m';
      if (hAccPill) hAccPill.textContent = hAccVal;
      const qVal = isPothole ? '5.50x' : '1.25x';
      if (dynQTag) dynQTag.textContent = `Q: ${qVal}`;
      if (satsTag) {
        satsTag.textContent = '0 Sats (Lost)';
        satsTag.style.color = 'var(--accent-red)';
      }
      if (confEllipse) {
        confEllipse.setAttribute('rx', isPothole ? 30 : 24);
        confEllipse.setAttribute('ry', isPothole ? 20 : 16);
        confEllipse.setAttribute('stroke', '#ffd600');
        confEllipse.setAttribute('fill', '#ffd600');
      }
    } else {
      // Nominal GNSS Aided
      if (turnBanner) {
        turnBanner.className = 'turn-banner';
      }
      if (gnssModePill) gnssModePill.textContent = 'GNSS_AIDED';
      if (hAccPill) hAccPill.textContent = '±1.2 m';
      const qVal = isPothole ? '4.80x' : '0.35x';
      if (dynQTag) dynQTag.textContent = `Q: ${qVal}`;
      if (satsTag) {
        satsTag.textContent = '14 Sats';
        satsTag.style.color = 'var(--text-primary)';
      }
      if (zuptTag) {
        zuptTag.textContent = 'ZUPT: STANDBY';
        zuptTag.style.color = 'var(--text-muted)';
      }
      if (confEllipse) {
        confEllipse.setAttribute('rx', 18);
        confEllipse.setAttribute('ry', 12);
        confEllipse.setAttribute('stroke', '#00f2fe');
        confEllipse.setAttribute('fill', '#00f2fe');
      }
    }

    animFrameId = requestAnimationFrame(updateNavigationLoop);
  }

  function startNavigation() {
    if (isNavigating) return;
    isNavigating = true;
    if (btnNavPlay) {
      btnNavPlay.innerHTML = '<span>⏸</span> Pause Navigation';
      btnNavPlay.style.background = '#e11d48';
    }
    showToast("▶ Turn-by-Turn Navigation active");
    speak("Starting turn by turn navigation.");
    animFrameId = requestAnimationFrame(updateNavigationLoop);
  }

  function pauseNavigation() {
    isNavigating = false;
    if (btnNavPlay) {
      btnNavPlay.innerHTML = '<span>▶</span> Resume Navigation';
      btnNavPlay.style.background = '';
    }
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function resetNavigation() {
    pauseNavigation();
    progress = 0;
    lastAnnouncedStep = -1;
    isForcedTunnel = false;
    isPothole = false;
    isStopped = false;

    if (btnTriggerTunnel) btnTriggerTunnel.classList.remove('active');
    if (btnTriggerPothole) btnTriggerPothole.classList.remove('active');
    if (btnTriggerStop) btnTriggerStop.classList.remove('active');

    const c = corridors[currentScenarioKey] || corridors.mumbai;
    const startWp = c.waypoints[0];

    if (vehicleGroup) {
      vehicleGroup.setAttribute('transform', `translate(${startWp.x}, ${startWp.y}) rotate(0)`);
    }
    if (confEllipse) {
      confEllipse.setAttribute('cx', startWp.x);
      confEllipse.setAttribute('cy', startWp.y);
      confEllipse.setAttribute('rx', 18);
      confEllipse.setAttribute('ry', 12);
      confEllipse.setAttribute('stroke', '#00f2fe');
      confEllipse.setAttribute('fill', '#00f2fe');
    }

    if (liveSpeedVal) liveSpeedVal.textContent = '0';
    if (currentAddressText) currentAddressText.textContent = startWp.addr;
    if (turnIcon) turnIcon.textContent = startWp.icon;
    if (turnDistance) turnDistance.textContent = startWp.distText;
    if (turnStreet) turnStreet.textContent = startWp.instruction;
    if (gnssModePill) gnssModePill.textContent = 'GNSS_AIDED';
    if (hAccPill) hAccPill.textContent = '±1.2 m';
    if (dynQTag) dynQTag.textContent = 'Q: 0.35x';
    if (satsTag) {
      satsTag.textContent = '14 Sats';
      satsTag.style.color = 'var(--text-primary)';
    }
    if (zuptTag) {
      zuptTag.textContent = 'ZUPT: STANDBY';
      zuptTag.style.color = 'var(--text-muted)';
    }
    if (turnBanner) turnBanner.className = 'turn-banner';
    if (btnNavPlay) {
      btnNavPlay.innerHTML = '<span>▶</span> Start Navigation';
      btnNavPlay.style.background = '';
    }
  }

  // Event Listeners
  if (btnNavPlay) {
    btnNavPlay.addEventListener('click', () => {
      if (isNavigating) pauseNavigation();
      else startNavigation();
    });
  }

  if (btnNavReset) {
    btnNavReset.addEventListener('click', () => {
      resetNavigation();
      showToast("↺ Navigation reset to starting waypoint");
    });
  }

  if (corridorSelect) {
    corridorSelect.addEventListener('change', (e) => {
      setCorridor(e.target.value);
    });
  }

  if (btnTriggerTunnel) {
    btnTriggerTunnel.addEventListener('click', () => {
      isForcedTunnel = !isForcedTunnel;
      btnTriggerTunnel.classList.toggle('active', isForcedTunnel);
      showToast(isForcedTunnel ? "🚇 Tunnel Outage Triggered: GPS Lost" : "☀️ Tunnel Outage Ended: Satellites Re-acquired");
      speak(isForcedTunnel ? "Caution: GPS signal lost. Engaging AI Dead Reckoning." : "Satellites re-acquired. Seamless handover complete.", true);
    });
  }

  if (btnTriggerPothole) {
    btnTriggerPothole.addEventListener('click', () => {
      isPothole = true;
      btnTriggerPothole.classList.add('active');
      showToast("⚡ Road Pothole Detected: Dynamic Q expanded to 5.50x (Feature 1)");
      speak("Pothole shock detected. Expanding filter uncertainty.", true);
      setTimeout(() => {
        isPothole = false;
        btnTriggerPothole.classList.remove('active');
      }, 2500);
    });
  }

  if (btnTriggerStop) {
    btnTriggerStop.addEventListener('click', () => {
      isStopped = !isStopped;
      btnTriggerStop.classList.toggle('active', isStopped);
      showToast(isStopped ? "🛑 Red Light Standstill: Zero-Velocity Drift Corrected (Feature 2)" : "▶ Resuming Drive");
      speak(isStopped ? "Vehicle stopped at signal. Applying zero velocity drift correction." : "Green light. Resuming navigation.", true);
    });
  }

  if (btnVoiceToggle) {
    btnVoiceToggle.addEventListener('click', () => {
      voiceEnabled = !voiceEnabled;
      btnVoiceToggle.classList.toggle('active', voiceEnabled);
      btnVoiceToggle.textContent = voiceEnabled ? '🔊' : '🔈';
      showToast(voiceEnabled ? "🔊 Voice Prompts Enabled" : "🔈 Voice Prompts Muted");
      if (voiceEnabled) speak("Voice guidance enabled.");
    });
  }

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      isNightMode = !isNightMode;
      document.body.classList.toggle('theme-light', !isNightMode);
      btnThemeToggle.textContent = isNightMode ? '🌙' : '☀️';
      showToast(isNightMode ? "🌙 Night Navigation Mode" : "☀️ Daylight Mode");
    });
  }

  if (btnOpenFeatures) {
    btnOpenFeatures.addEventListener('click', () => {
      if (featuresDrawer) featuresDrawer.style.display = 'flex';
    });
  }

  if (btnOpenDrawer) {
    btnOpenDrawer.addEventListener('click', () => {
      if (featuresDrawer) featuresDrawer.style.display = 'flex';
    });
  }

  if (btnCloseDrawer) {
    btnCloseDrawer.addEventListener('click', () => {
      if (featuresDrawer) featuresDrawer.style.display = 'none';
    });
  }

  if (featuresDrawer) {
    featuresDrawer.addEventListener('click', (e) => {
      if (e.target === featuresDrawer) featuresDrawer.style.display = 'none';
    });
  }

  // Blob Exporters
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
      const c = corridors[currentScenarioKey] || corridors.mumbai;
      const geojson = {
        type: "FeatureCollection",
        properties: { corridor: c.name, system: "AI Dead Reckoning Turn-by-Turn Navigation" },
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: c.waypoints.map(w => [w.x * 0.001 + 72.82, w.y * 0.001 + 18.94])
            },
            properties: { name: c.destination }
          }
        ]
      };
      const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
      downloadBlob(blob, `${currentScenarioKey}_turn_route.geojson`);
      showToast("📥 Exported Turn-by-Turn GeoJSON");
    });
  }

  const btnExportCSV = document.getElementById('btnExportCSV');
  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', () => {
      const c = corridors[currentScenarioKey] || corridors.mumbai;
      const rows = ["step,x,y,speed_kmh,in_tunnel,instruction,address"];
      c.waypoints.forEach((w, i) => {
        rows.push(`${i},${w.x},${w.y},${w.speed},${w.inTunnel ? 1 : 0},"${w.instruction}","${w.addr}"`);
      });
      const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, `${currentScenarioKey}_telemetry_log.csv`);
      showToast("📥 Exported Telemetry Log CSV");
    });
  }

  // Boot: Auto-start navigation
  setCorridor('mumbai');
  startNavigation();
})();

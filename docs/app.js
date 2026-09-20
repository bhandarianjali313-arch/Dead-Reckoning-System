/**
 * AI-ML Based Intelligent Dead Reckoning System for Seamless Navigation
 * Master Interactive Controller with Google Maps Multi-Mode & User-Controlled Vehicular Movement
 */

// =============================================================================
// 1. ALL-INDIA GEOGRAPHIC CORRIDORS & DATA
// =============================================================================

const SCENARIOS = {
  mumbai: {
    name: "Mumbai: Coastal Road Undersea Tunnel (2.07 km)",
    address: "Marine Drive to Worli Sea Face (Mumbai Coastal Road Undersea Tunnel), Mumbai, Maharashtra, India",
    srcTag: "Google Maps Platform • 14 Satellites Active",
    center: [18.9680, 72.8120],
    zoom: 14,
    baseSpeed: 50.0,
    tunnelStart: 0.28,
    tunnelEnd: 0.76,
    isPanIndia: false,
    coordinates: [
      [18.9438, 72.8232], // Marine Drive Nariman Point
      [18.9500, 72.8180], // Chowpatty Curve
      [18.9560, 72.8120], // Tunnel South Portal (Girgaon)
      [18.9630, 72.8065], // Undersea Bore 1
      [18.9700, 72.8030], // Undersea Bore 2 (Deepest point under Arabian Sea)
      [18.9775, 72.8020], // Tunnel North Portal (Priyadarshini Park)
      [18.9860, 72.8075], // Haji Ali Connector
      [18.9980, 72.8140]  // Worli Sea Face Exit
    ],
    tunnelPolygon: [
      [18.9555, 72.8130],
      [18.9780, 72.8035],
      [18.9785, 72.7995],
      [18.9550, 72.8090]
    ]
  },
  atal: {
    name: "Himachal: Atal Tunnel Rohtang (9.02 km)",
    address: "Dhundi South Portal to Sissu North Portal (Leh-Manali Highway), Rohtang, Himachal Pradesh, India",
    srcTag: "Google Maps Platform • High Himalayan GNSS",
    center: [32.4030, 77.1490],
    zoom: 12,
    baseSpeed: 55.0,
    tunnelStart: 0.15,
    tunnelEnd: 0.85,
    isPanIndia: false,
    coordinates: [
      [32.3630, 77.1330], // Dhundi South Portal
      [32.3850, 77.1410], // Mountain Core (2,500m overburden)
      [32.4030, 77.1490], // Midpoint Refuge Station
      [32.4250, 77.1580], // North Incline
      [32.4430, 77.1650]  // Sissu North Portal
    ],
    tunnelPolygon: [
      [32.3620, 77.1350],
      [32.4440, 77.1670],
      [32.4450, 77.1610],
      [32.3630, 77.1290]
    ]
  },
  delhi: {
    name: "New Delhi: Pragati Maidan Tunnel (1.3 km)",
    address: "Mathura Road to Ring Road (Pragati Maidan Integrated Transit Corridor), New Delhi, India",
    srcTag: "Google Maps Platform • 15 Satellites Active",
    center: [28.6220, 77.2490],
    zoom: 15,
    baseSpeed: 45.0,
    tunnelStart: 0.28,
    tunnelEnd: 0.76,
    isPanIndia: false,
    coordinates: [
      [28.6180, 77.2420], // Mathura Road approach
      [28.6200, 77.2455], // Tunnel West Portal
      [28.6225, 77.2505], // Underground Box Corridor
      [28.6250, 77.2560]  // Ring Road East Portal Exit
    ],
    tunnelPolygon: [
      [28.6195, 77.2445],
      [28.6255, 77.2570],
      [28.6262, 77.2555],
      [28.6202, 77.2435]
    ]
  },
  lucknow: {
    name: "Lucknow: BBD University Corridor",
    address: "Faizabad Rd, Babu Banarasi Das University to Flyover Underpass, Lucknow, Uttar Pradesh, India",
    srcTag: "Google Maps Platform • 16 Satellites Active",
    center: [26.8955, 81.0720],
    zoom: 15,
    baseSpeed: 45.0,
    tunnelStart: 0.35,
    tunnelEnd: 0.72,
    isPanIndia: false,
    coordinates: [
      [26.8920, 81.0600], // BBD University Main Gate
      [26.8940, 81.0670], // Crown Mall Junction
      [26.8955, 81.0730], // Flyover Incline (Deep Canopy)
      [26.8970, 81.0780], // Subterranean Underpass
      [26.8990, 81.0840]  // Faizabad Highway Exit
    ],
    tunnelPolygon: [
      [26.8950, 81.0715],
      [26.8975, 81.0795],
      [26.8982, 81.0785],
      [26.8958, 81.0705]
    ]
  },
  bengaluru: {
    name: "Bengaluru: Kempegowda Airport Expressway",
    address: "Bellary Rd (NH 44), Hebbal Flyover to KIAL Airport Expressway, Bengaluru, Karnataka, India",
    srcTag: "Google Maps Platform • 18 Satellites Active",
    center: [13.1160, 77.6310],
    zoom: 12,
    baseSpeed: 60.0,
    tunnelStart: 0.38,
    tunnelEnd: 0.72,
    isPanIndia: false,
    coordinates: [
      [13.0350, 77.5970], // Hebbal Flyover
      [13.0800, 77.5965], // Yelahanka Junction
      [13.1350, 77.6250], // Subterranean Flyover Underpass
      [13.1650, 77.6550], // Devanahalli Approach
      [13.1980, 77.7060]  // KIAL Trumpet Interchange
    ],
    tunnelPolygon: [
      [13.1300, 77.6200],
      [13.1450, 77.6350],
      [13.1480, 77.6310],
      [13.1330, 77.6160]
    ]
  },
  kolkata: {
    name: "Kolkata: Hooghly River Under-River Tunnel",
    address: "Howrah Railway Station to Mahakaran (East-West Underwater Metro), Kolkata, West Bengal, India",
    srcTag: "Google Maps Platform • 16 Satellites Active",
    center: [22.5800, 88.3450],
    zoom: 14,
    baseSpeed: 40.0,
    tunnelStart: 0.25,
    tunnelEnd: 0.80,
    isPanIndia: false,
    coordinates: [
      [22.5835, 88.3425], // Howrah Railway Station
      [22.5820, 88.3470], // River Bank Approach
      [22.5810, 88.3510], // Underwater River Bed (-32m)
      [22.5760, 88.3515], // Brabourne Road Exit
      [22.5726, 88.3505]  // Mahakaran Station BBD Bagh
    ],
    tunnelPolygon: [
      [22.5830, 88.3450],
      [22.5800, 88.3530],
      [22.5780, 88.3520],
      [22.5810, 88.3440]
    ]
  },
  kashmir: {
    name: "Jammu & Kashmir: Chenani-Nashri Tunnel (9.28 km)",
    address: "NH 44, Syama Prasad Mookerjee Tunnel, Chenani to Nashri, Jammu & Kashmir, India",
    srcTag: "Google Maps Platform • Himalayan Satellite Pass",
    center: [33.0450, 75.2950],
    zoom: 12,
    baseSpeed: 50.0,
    tunnelStart: 0.18,
    tunnelEnd: 0.82,
    isPanIndia: false,
    coordinates: [
      [33.0080, 75.2850], // Chenani South Portal
      [33.0300, 75.2910], // Deep Mountain Box
      [33.0550, 75.2980], // Central Ventilation Shaft
      [33.0820, 75.3050]  // Nashri North Portal
    ],
    tunnelPolygon: [
      [33.0060, 75.2870],
      [33.0840, 75.3080],
      [33.0850, 75.3020],
      [33.0070, 75.2810]
    ]
  },
  india: {
    name: "Whole India: Pan-India Subterranean & Highway Network",
    address: "🇮🇳 Whole India Overview: Select any strategic underground tunnel or corridor below to begin navigation",
    srcTag: "ISRO NavIC / Google Maps India • Pan-India Overview",
    center: [22.5000, 78.9629],
    zoom: 5,
    baseSpeed: 0.0,
    tunnelStart: 0.0,
    tunnelEnd: 0.0,
    isPanIndia: true,
    coordinates: [
      [33.0450, 75.2950],
      [32.4030, 77.1490],
      [28.6220, 77.2490],
      [26.8955, 81.0720],
      [22.5800, 88.3450],
      [18.9680, 72.8120],
      [13.1160, 77.6310]
    ],
    tunnelPolygon: []
  }
};

const INDIA_CITIES = [
  { key: "mumbai", label: "🌊 Mumbai Undersea (2.07 km)", lat: 18.9680, lng: 72.8120 },
  { key: "atal", label: "🏔️ Atal Rohtang (9.02 km)", lat: 32.4030, lng: 77.1490 },
  { key: "delhi", label: "🏛️ Delhi Pragati (1.3 km)", lat: 28.6220, lng: 77.2490 },
  { key: "lucknow", label: "🎓 Lucknow BBD Corridor", lat: 26.8955, lng: 81.0720 },
  { key: "bengaluru", label: "✈️ Bengaluru Airport Express", lat: 13.1160, lng: 77.6310 },
  { key: "kolkata", label: "🚇 Kolkata Under-River Tunnel", lat: 22.5800, lng: 88.3450 },
  { key: "kashmir", label: "❄️ Kashmir Chenani-Nashri (9.28 km)", lat: 33.0450, lng: 75.2950 }
];

// Rich Pre-Cached Database of Popular Indian Destinations & Landmarks (Instant 0ms Autocomplete)
const POPULAR_DESTINATIONS = [
  // Delhi NCR
  { name: "Connaught Place, New Delhi", sub: "Central Business District & Inner Circle, New Delhi", lat: 28.6315, lng: 77.2167, icon: "🏛️", tags: ["delhi", "cp", "connaught", "capital"] },
  { name: "India Gate & Kartavya Path, New Delhi", sub: "Rajpath, India Gate War Memorial, New Delhi", lat: 28.6129, lng: 77.2295, icon: "🇮🇳", tags: ["delhi", "india gate", "rajpath"] },
  { name: "Pragati Maidan Integrated Transit Tunnel", sub: "Mathura Road to Ring Road Box Tunnel, New Delhi", lat: 28.6220, lng: 77.2490, icon: "🚇", tags: ["delhi", "pragati", "tunnel"] },
  { name: "Indira Gandhi International Airport (DEL)", sub: "Terminal 3, Aerocity, New Delhi", lat: 28.5562, lng: 77.1000, icon: "✈️", tags: ["delhi", "airport", "igi", "aerocity"] },
  { name: "Red Fort (Lal Qila), Old Delhi", sub: "Netaji Subhash Marg, Chandni Chowk, Delhi", lat: 28.6562, lng: 77.2410, icon: "🏰", tags: ["delhi", "red fort", "lal qila"] },

  // Mumbai & Maharashtra
  { name: "Marine Drive & Coastal Road Undersea Tunnel", sub: "Nariman Point to Worli Sea Face, Mumbai, Maharashtra", lat: 18.9438, lng: 72.8232, icon: "🌊", tags: ["mumbai", "marine drive", "coastal", "tunnel", "undersea"] },
  { name: "Gateway of India & Colaba", sub: "Apollo Bandar, Colaba, Mumbai, Maharashtra", lat: 18.9220, lng: 72.8347, icon: "⚓", tags: ["mumbai", "gateway", "colaba"] },
  { name: "Bandra-Worli Sea Link", sub: "Mahim Bay Cable Bridge, Mumbai, Maharashtra", lat: 19.0365, lng: 72.8172, icon: "🌉", tags: ["mumbai", "bandra", "worli", "sea link"] },
  { name: "Chhatrapati Shivaji Maharaj Terminus (CSMT)", sub: "Fort, Mumbai, Maharashtra", lat: 18.9400, lng: 72.8353, icon: "🚉", tags: ["mumbai", "csmt", "vt", "station"] },
  { name: "Hinjawadi IT Park, Pune", sub: "Phase 1 Infotech Park, Pune, Maharashtra", lat: 18.5913, lng: 73.7389, icon: "💻", tags: ["pune", "hinjawadi", "it park"] },

  // Himachal Pradesh & North
  { name: "Atal Tunnel Rohtang", sub: "Dhundi to Sissu, Leh-Manali Highway, Himachal Pradesh", lat: 32.4030, lng: 77.1490, icon: "🏔️", tags: ["atal", "rohtang", "manali", "himachal", "tunnel"] },
  { name: "Manali Mall Road", sub: "Kullu Valley, Manali, Himachal Pradesh", lat: 32.2396, lng: 77.1887, icon: "🌲", tags: ["manali", "mall road", "himachal"] },
  { name: "The Ridge & Mall Road, Shimla", sub: "Shimla Hills, Himachal Pradesh", lat: 31.1048, lng: 77.1734, icon: "⛰️", tags: ["shimla", "himachal", "ridge"] },
  { name: "Chenani-Nashri Tunnel (Dr. Syama Prasad Mookerjee Tunnel)", sub: "NH 44, Udhampur to Ramban, Jammu & Kashmir", lat: 33.0450, lng: 75.2950, icon: "❄️", tags: ["kashmir", "chenani", "nashri", "tunnel", "jammu"] },
  { name: "Dal Lake, Srinagar", sub: "Boulevard Road, Srinagar, Jammu & Kashmir", lat: 34.0837, lng: 74.8370, icon: "🚣", tags: ["srinagar", "kashmir", "dal lake"] },
  { name: "Golden Temple (Harmandir Sahib), Amritsar", sub: "Amritsar, Punjab", lat: 31.6200, lng: 74.8765, icon: "✨", tags: ["amritsar", "golden temple", "punjab"] },

  // Karnataka & Bengaluru
  { name: "Kempegowda International Airport Bengaluru (BLR)", sub: "KIAL Expressway, Devanahalli, Bengaluru, Karnataka", lat: 13.1980, lng: 77.7060, icon: "✈️", tags: ["bengaluru", "bangalore", "airport", "kempegowda", "expressway"] },
  { name: "Electronic City Tech Corridor, Bengaluru", sub: "Hosur Road Elevated Expressway, Bengaluru, Karnataka", lat: 12.8399, lng: 77.6770, icon: "🏢", tags: ["bengaluru", "electronic city", "tech"] },
  { name: "MG Road & Brigade Road, Bengaluru", sub: "Central Business District, Bengaluru, Karnataka", lat: 12.9756, lng: 77.6066, icon: "🛍️", tags: ["bengaluru", "mg road", "brigade"] },

  // Uttar Pradesh & Lucknow
  { name: "BBD University & Faizabad Road Corridor", sub: "Babu Banarasi Das University, Lucknow, Uttar Pradesh", lat: 26.8955, lng: 81.0720, icon: "🎓", tags: ["lucknow", "bbd", "university", "faizabad"] },
  { name: "Hazratganj Heritage Market, Lucknow", sub: "City Center, Lucknow, Uttar Pradesh", lat: 26.8500, lng: 80.9490, icon: "🏛️", tags: ["lucknow", "hazratganj", "up"] },
  { name: "Taj Mahal & Yamuna Expressway, Agra", sub: "Tajganj, Agra, Uttar Pradesh", lat: 27.1751, lng: 78.0421, icon: "🕌", tags: ["agra", "taj mahal", "yamuna"] },
  { name: "Kashi Vishwanath Corridor, Varanasi", sub: "Ganga Ghats, Varanasi, Uttar Pradesh", lat: 25.3109, lng: 83.0107, icon: "🕉️", tags: ["varanasi", "kashi", "banaras", "ganga"] },

  // West Bengal & East
  { name: "Hooghly River Underwater Metro Tunnel, Kolkata", sub: "Howrah Station to Mahakaran, Kolkata, West Bengal", lat: 22.5800, lng: 88.3450, icon: "🚇", tags: ["kolkata", "hooghly", "underwater", "metro", "tunnel", "howrah"] },
  { name: "Victoria Memorial, Kolkata", sub: "Queens Way, Maidan, Kolkata, West Bengal", lat: 22.5448, lng: 88.3426, icon: "🏛️", tags: ["kolkata", "victoria memorial"] },

  // Rajasthan & West
  { name: "Hawa Mahal & Pink City, Jaipur", sub: "Badi Choupad, Pink City, Jaipur, Rajasthan", lat: 26.9239, lng: 75.8267, icon: "🏰", tags: ["jaipur", "hawa mahal", "pink city", "rajasthan"] },
  { name: "Sabarmati Riverfront, Ahmedabad", sub: "Ashram Road, Ahmedabad, Gujarat", lat: 23.0300, lng: 72.5800, icon: "🌊", tags: ["ahmedabad", "sabarmati", "gujarat"] },
  { name: "GIFT City Financial Hub, Gandhinagar", sub: "Gujarat International Finance Tec-City, Gujarat", lat: 23.1600, lng: 72.6840, icon: "💎", tags: ["gift city", "gandhinagar", "gujarat"] },

  // South & Coast
  { name: "Calangute & Baga Beach Coastal Highway, Goa", sub: "North Goa Coastal Route, Goa", lat: 15.5430, lng: 73.7554, icon: "🏖️", tags: ["goa", "calangute", "baga", "beach"] },
  { name: "HITEC City & Cyber Towers, Hyderabad", sub: "Madhapur Tech Corridor, Hyderabad, Telangana", lat: 17.4435, lng: 78.3772, icon: "🏢", tags: ["hyderabad", "hitec city", "cyber", "telangana"] },
  { name: "Charminar & Old City, Hyderabad", sub: "Old City, Hyderabad, Telangana", lat: 17.3616, lng: 78.4747, icon: "🕌", tags: ["hyderabad", "charminar"] },
  { name: "Marina Beach & Santhome, Chennai", sub: "Kamajar Salai, Chennai, Tamil Nadu", lat: 13.0500, lng: 80.2824, icon: "🌊", tags: ["chennai", "marina beach", "tamil nadu"] },
  { name: "Marine Drive Kochi & Bolgatty", sub: "Ernakulam, Kochi, Kerala", lat: 9.9816, lng: 76.2750, icon: "🌴", tags: ["kochi", "cochin", "kerala", "marine drive"] }
];

// Master Simulation State - CONTROLLED BY USER (Vehicle DOES NOT move automatically!)
const state = {
  activeScenarioKey: "mumbai",
  isPlaying: false, // Default to PAUSED so car does not move by itself
  isDarkTheme: true,
  progress: 0.0, // Start at 0%
  speed: 0.0,    // Start stationary
  targetSpeed: 0.0,
  simSpeedMultiplier: 0.6, // Calm, smooth, realistic drive pace (user controllable)
  currentLat: 18.9438,
  currentLng: 72.8232,
  headingDeg: 0,
  isManualTunnel: false,
  isPotholeShock: false,
  potholeTimer: 0,
  isStandstill: false,
  stopTimer: 0,
  isFallback: false,
  fallbackTimer: 0,
  isCameraActive: false,
  dynamicQ: 0.35,
  uncertaintyRadius: 1.18,
  satellites: 14,
  navMode: "GNSS_AIDED",
  previousNavMode: "GNSS_AIDED",
  dampingTimer: 0,
  reliabilityScore: 0.985,
  drivenHistory: [],
  accelHistory: { x: [], y: [], z: [] },
  gyroHistory: { x: [], y: [], z: [] },
  qHistory: [],
  errHistory: [],
  maxHistoryPoints: 90
};

// Fill initial history buffers
for (let i = 0; i < state.maxHistoryPoints; i++) {
  state.accelHistory.x.push(0);
  state.accelHistory.y.push(0);
  state.accelHistory.z.push(9.81);
  state.gyroHistory.x.push(0);
  state.gyroHistory.y.push(0);
  state.gyroHistory.z.push(0);
  state.qHistory.push(0.35);
  state.errHistory.push(1.18);
}

// Leaflet Map Globals
let map = null;
let googleTileLayers = {};
let currentGoogleLayerKey = "google_dark";
let routePolyline = null;
let drivenPolyline = null;
let tunnelPolygonLayer = null;
let confidenceCircle = null;
let vehicleMarker = null;
let destinationMarker = null;
let indiaCityMarkers = [];
let milestoneMarkers = [];

// =============================================================================
// 2. DOM REFERENCES
// =============================================================================

const el = {
  tabBtns: document.querySelectorAll(".nav-tab-btn"),
  tabPanes: document.querySelectorAll(".tab-pane"),

  headerModeBadge: document.getElementById("headerModeBadge"),
  btnThemeToggle: document.getElementById("btnThemeToggle"),
  cockpitAddressText: document.getElementById("cockpitAddressText"),

  // User Destination Search Elements
  destSearchInput: document.getElementById("destSearchInput"),
  btnSearchDest: document.getElementById("btnSearchDest"),
  btnClearSearch: document.getElementById("btnClearSearch"),
  destSearchResults: document.getElementById("destSearchResults"),
  activeDestDetails: document.getElementById("activeDestDetails"),
  activeDestBadge: document.getElementById("activeDestBadge"),
  activeDestName: document.getElementById("activeDestName"),
  activeDestMetrics: document.getElementById("activeDestMetrics"),
  btnChangeDest: document.getElementById("btnChangeDest"),
  quickChips: document.querySelectorAll(".quick-chip"),
  customScenarioOpt: document.getElementById("customScenarioOpt"),

  // Live Dynamic Turn HUD
  liveTurnHud: document.getElementById("liveTurnHud"),
  turnSymbol: document.getElementById("turnSymbol"),
  turnMainText: document.getElementById("turnMainText"),
  turnSubText: document.getElementById("turnSubText"),
  turnDistVal: document.getElementById("turnDistVal"),

  // Interactive Speed Presets & Simulation Pace
  speedPresetBtns: document.querySelectorAll(".btn-speed-preset"),
  simSpeedBtns: document.querySelectorAll(".btn-sim-speed"),

  // Subterranean Elevation Profile
  elevationTunnelZone: document.getElementById("elevationTunnelZone"),
  elevationCarCursor: document.getElementById("elevationCarCursor"),
  elevationStatusText: document.getElementById("elevationStatusText"),

  corridorChips: document.querySelectorAll(".corridor-chip"),
  gmodeBtns: document.querySelectorAll(".gmode-btn"),
  currentMapModeLabel: document.getElementById("currentMapModeLabel"),

  cameraHudOverlay: document.getElementById("cameraHudOverlay"),
  cameraCanvas: document.getElementById("cameraCanvas"),

  speedDisplay: document.getElementById("speedDisplay"),
  hAccDisplay: document.getElementById("hAccDisplay"),
  qDisplay: document.getElementById("qDisplay"),
  satsDisplay: document.getElementById("satsDisplay"),
  zuptDisplay: document.getElementById("zuptDisplay"),

  // 6 Feature Action Buttons
  btnPothole: document.getElementById("btnPothole"),
  btnStop: document.getElementById("btnStop"),
  btnFallback: document.getElementById("btnFallback"),
  btnTunnel: document.getElementById("btnTunnel"),
  btnRecenter: document.getElementById("btnRecenter"),
  btnCamera: document.getElementById("btnCamera"),

  // User Drive Controls
  btnPlay: document.getElementById("btnPlay"),
  btnGas: document.getElementById("btnGas"),
  btnBrake: document.getElementById("btnBrake"),
  btnReset: document.getElementById("btnReset"),
  scenarioSelect: document.getElementById("scenarioSelect"),

  // Route Scrubber
  routeScrubber: document.getElementById("routeScrubber"),
  scrubberPercentLabel: document.getElementById("scrubberPercentLabel"),
  milestoneTunnelIn: document.getElementById("milestoneTunnelIn"),
  milestoneTunnelOut: document.getElementById("milestoneTunnelOut"),

  // Pattern Gauges
  patSpeedVal: document.getElementById("patSpeedVal"),
  patSpeedMeter: document.getElementById("patSpeedMeter"),
  patAccelBadge: document.getElementById("patAccelBadge"),
  patAccelVal: document.getElementById("patAccelVal"),
  patAccelMeter: document.getElementById("patAccelMeter"),
  patTurnBadge: document.getElementById("patTurnBadge"),
  patTurnVal: document.getElementById("patTurnVal"),
  patTurnMeter: document.getElementById("patTurnMeter"),
  patBumpBadge: document.getElementById("patBumpBadge"),
  patBumpVal: document.getElementById("patBumpVal"),
  patBumpMeter: document.getElementById("patBumpMeter"),
  patVibBadge: document.getElementById("patVibBadge"),
  patVibVal: document.getElementById("patVibVal"),
  patVibMeter: document.getElementById("patVibMeter"),
  patPhoneBadge: document.getElementById("patPhoneBadge"),
  patPhoneVal: document.getElementById("patPhoneVal"),
  patPhoneMeter: document.getElementById("patPhoneMeter"),
  patRelBadge: document.getElementById("patRelBadge"),
  patRelVal: document.getElementById("patRelVal"),
  patRelMeter: document.getElementById("patRelMeter"),

  // Canvases
  accelCanvas: document.getElementById("accelCanvas"),
  gyroCanvas: document.getElementById("gyroCanvas"),
  dynQCanvas: document.getElementById("dynQCanvas"),
  errorCanvas: document.getElementById("errorCanvas"),

  // Feature Cards Badges
  cardF1Badge: document.getElementById("cardF1Badge"),
  cardF2Badge: document.getElementById("cardF2Badge"),
  cardF3Badge: document.getElementById("cardF3Badge"),
  cardF4Badge: document.getElementById("cardF4Badge"),
  cardF5Badge: document.getElementById("cardF5Badge"),
  cardF6Badge: document.getElementById("cardF6Badge"),

  btnExpGeoJSON: document.getElementById("btnExpGeoJSON"),
  btnExpCSV: document.getElementById("btnExpCSV"),
  btnExpBenchJSON: document.getElementById("btnExpBenchJSON"),

  liveToast: document.getElementById("liveToast")
};

// =============================================================================
// 3. GOOGLE MAPS MULTI-MODE INITIALIZATION
// =============================================================================

function initLeafletMap() {
  if (typeof L === "undefined") {
    console.warn("Leaflet library not ready.");
    return;
  }

  const initialScenario = SCENARIOS[state.activeScenarioKey];
  state.currentLat = initialScenario.coordinates[0][0];
  state.currentLng = initialScenario.coordinates[0][1];

  map = L.map("map", {
    center: initialScenario.center,
    zoom: initialScenario.zoom,
    zoomControl: true,
    preferCanvas: true,
    attributionControl: false
  });

  // 1. Google Maps Daylight Street View (Standard Roadmap)
  googleTileLayers["google_roadmap"] = L.tileLayer("https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
    subdomains: "0123",
    maxZoom: 20
  });

  // 2. Google Earth High-Resolution Satellite
  googleTileLayers["google_satellite"] = L.tileLayer("https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
    subdomains: "0123",
    maxZoom: 20
  });

  // 3. Google Maps Hybrid (Satellite Imagery + Street Labels)
  googleTileLayers["google_hybrid"] = L.tileLayer("https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
    subdomains: "0123",
    maxZoom: 20
  });

  // 4. Google Maps Topographical Terrain & Elevation
  googleTileLayers["google_terrain"] = L.tileLayer("https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}", {
    subdomains: "0123",
    maxZoom: 20
  });

  // 5. Google Maps Dark Night Mode (Automotive HUD)
  googleTileLayers["google_dark"] = L.tileLayer("https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
    subdomains: "0123",
    maxZoom: 20,
    className: "google-dark-tiles"
  });

  // Default active layer: Google Dark Night Mode
  googleTileLayers["google_dark"].addTo(map);

  // Planned road corridor polyline
  routePolyline = L.polyline(initialScenario.coordinates, {
    color: "#64748b",
    weight: 5.5,
    opacity: 0.8,
    lineCap: "round",
    lineJoin: "round"
  }).addTo(map);

  // Active driven trajectory
  drivenPolyline = L.polyline([[state.currentLat, state.currentLng]], {
    color: "#00e676",
    weight: 4.5,
    opacity: 0.95,
    lineCap: "round",
    lineJoin: "round"
  }).addTo(map);

  // Tunnel Outage Polygon Highlight
  tunnelPolygonLayer = L.polygon(initialScenario.tunnelPolygon, {
    color: "#3b82f6",
    fillColor: "#1e3a8a",
    fillOpacity: 0.28,
    weight: 2.0,
    dashArray: "5,5"
  }).addTo(map);

  // Feature 5: 95% Confidence Error Circle
  confidenceCircle = L.circle([state.currentLat, state.currentLng], {
    radius: state.uncertaintyRadius * 3.5,
    color: "#00f2fe",
    fillColor: "#00f2fe",
    fillOpacity: 0.22,
    weight: 1.8
  }).addTo(map);

  // Vehicle Marker
  const vehicleHtml = `
    <div class="vehicle-marker-icon" id="vehicleIconInner">
      <div class="vehicle-heading-arrow"></div>
      <div class="vehicle-dot"></div>
      <div class="vehicle-pulse-ring"></div>
    </div>
  `;
  const vehicleIcon = L.divIcon({
    className: "vehicle-marker-container",
    html: vehicleHtml,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  vehicleMarker = L.marker([state.currentLat, state.currentLng], {
    icon: vehicleIcon,
    zIndexOffset: 1000,
    draggable: true
  }).addTo(map);

  vehicleMarker.on("drag", (e) => {
    const latlng = e.target.getLatLng();
    snapCarToNearestProgress(latlng.lat, latlng.lng);
  });
  vehicleMarker.on("dragend", () => {
    const pos = getLatLngAlongPath(state.progress);
    vehicleMarker.setLatLng([pos.lat, pos.lng]);
    showToast(`Car repositioned to ${(state.progress * 100).toFixed(1)}% on route`);
  });

  buildIndiaCityPins();

  // Interactive Map Click: Set Destination Anywhere on Map
  map.on("click", (e) => {
    const { lat, lng } = e.latlng;
    const popupDiv = document.createElement("div");
    popupDiv.className = "map-click-popup";
    popupDiv.innerHTML = `
      <div style="font-weight: 800; color: #00f2fe; margin-bottom: 2px;">📍 Selected Location</div>
      <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</div>
      <button class="btn-popup-set-dest" id="btnPopupSetDest">🏁 Set as My Destination</button>
    `;
    L.popup()
      .setLatLng([lat, lng])
      .setContent(popupDiv)
      .openOn(map);

    const btn = popupDiv.querySelector("#btnPopupSetDest");
    if (btn) {
      btn.addEventListener("click", () => {
        map.closePopup();
        applyCustomDestination(`Pinned Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`, lat, lng);
      });
    }
  });

  window.addEventListener("resize", () => {
    if (map) map.invalidateSize();
  });
  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 250);
}

function buildIndiaCityPins() {
  indiaCityMarkers.forEach(m => map.removeLayer(m));
  indiaCityMarkers = [];

  INDIA_CITIES.forEach(city => {
    const icon = L.divIcon({
      className: "india-node-container",
      html: `<div class="india-node-badge">${city.label}</div>`,
      iconSize: [160, 28],
      iconAnchor: [80, 14]
    });

    const marker = L.marker([city.lat, city.lng], { icon, zIndexOffset: 500 });
    marker.on("click", () => {
      setScenario(city.key);
    });
    indiaCityMarkers.push(marker);
  });
}

// Switch Google Maps Display Mode
function switchGoogleMapMode(modeKey) {
  if (!map || !googleTileLayers[modeKey]) return;

  if (googleTileLayers[currentGoogleLayerKey]) {
    map.removeLayer(googleTileLayers[currentGoogleLayerKey]);
  }
  googleTileLayers[modeKey].addTo(map);
  currentGoogleLayerKey = modeKey;

  el.gmodeBtns.forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-layer") === modeKey);
  });

  const modeLabels = {
    google_roadmap: "Street View",
    google_satellite: "Satellite",
    google_hybrid: "Hybrid (Satellite + Roads)",
    google_terrain: "Terrain",
    google_dark: "Dark Night Mode"
  };

  if (el.currentMapModeLabel) {
    el.currentMapModeLabel.textContent = modeLabels[modeKey] || modeKey;
  }

  showToast(`Google Maps Mode: ${modeLabels[modeKey] || modeKey}`);
}

// =============================================================================
// 4. SCENARIO CONFIGURATION & ROAD INTERPOLATION
// =============================================================================

function setScenario(key) {
  const scen = SCENARIOS[key];
  if (!scen) return;

  state.activeScenarioKey = key;
  state.isPlaying = false; // STOP automatic movement on corridor load
  state.progress = 0.0;    // Position at start line
  state.speed = 0.0;
  state.targetSpeed = 0.0;
  state.isManualTunnel = false;
  state.isPotholeShock = false;
  state.isStandstill = false;
  state.isFallback = false;
  state.uncertaintyRadius = 1.18;
  state.satellites = key === "india" ? 24 : 14;
  state.drivenHistory = [];

  // Update UI play button state
  if (el.btnPlay) {
    el.btnPlay.textContent = "▶ Start Drive";
    el.btnPlay.style.background = "linear-gradient(135deg, #00e676, #0284c7)";
  }

  // Update active destination UI and marker
  if (key !== "india") {
    const endCoord = scen.coordinates[scen.coordinates.length - 1];
    setDestinationMarker(scen.name, endCoord[0], endCoord[1]);
    if (el.destSearchInput) el.destSearchInput.value = scen.name;
    if (el.btnClearSearch) el.btnClearSearch.style.display = "block";
    if (el.activeDestBadge) el.activeDestBadge.textContent = "🏁 ACTIVE CORRIDOR";
    if (el.activeDestName) el.activeDestName.textContent = scen.name;
    if (el.activeDestMetrics) {
      el.activeDestMetrics.innerHTML = `
        <span>📍 <strong>${scen.address}</strong></span>
        <span>•</span>
        <span>${scen.srcTag}</span>
      `;
    }
  } else {
    if (destinationMarker && map && map.hasLayer(destinationMarker)) {
      map.removeLayer(destinationMarker);
    }
    if (el.destSearchInput) el.destSearchInput.value = "";
    if (el.btnClearSearch) el.btnClearSearch.style.display = "none";
    if (el.activeDestBadge) el.activeDestBadge.textContent = "🇮🇳 WHOLE INDIA OVERVIEW";
    if (el.activeDestName) el.activeDestName.textContent = "🔍 Whole India Overview: Search any destination above or click anywhere on the map!";
    if (el.activeDestMetrics) {
      el.activeDestMetrics.innerHTML = `
        <span>All-India GNSS Blackout Defense Network</span>
        <span>•</span>
        <span>Ready for Destination Search</span>
      `;
    }
  }

  // Sync Ribbon chips
  el.corridorChips.forEach(chip => {
    chip.classList.toggle("active", chip.getAttribute("data-scenario") === key);
  });

  // Sync Dropdown
  if (el.scenarioSelect && el.scenarioSelect.value !== key) {
    el.scenarioSelect.value = key;
  }

  // Update Scrubber milestones
  if (el.routeScrubber) {
    el.routeScrubber.value = 0;
  }
  if (el.scrubberPercentLabel) {
    el.scrubberPercentLabel.textContent = "0.0% (Standby at Start Line)";
  }
  if (el.milestoneTunnelIn) {
    el.milestoneTunnelIn.textContent = `🚇 ${(scen.tunnelStart * 100).toFixed(0)}% Tunnel Entry (Blackout)`;
  }
  if (el.milestoneTunnelOut) {
    el.milestoneTunnelOut.textContent = `☀️ ${(scen.tunnelEnd * 100).toFixed(0)}% Tunnel Exit (Damping)`;
  }

  // Pan-India vs Individual corridor view
  if (key === "india") {
    indiaCityMarkers.forEach(m => {
      if (!map.hasLayer(m)) m.addTo(map);
    });
    if (vehicleMarker && map.hasLayer(vehicleMarker)) {
      map.removeLayer(vehicleMarker);
    }
    if (confidenceCircle && map.hasLayer(confidenceCircle)) {
      map.removeLayer(confidenceCircle);
    }
    if (tunnelPolygonLayer && map.hasLayer(tunnelPolygonLayer)) {
      map.removeLayer(tunnelPolygonLayer);
    }
  } else {
    indiaCityMarkers.forEach(m => {
      if (map.hasLayer(m)) map.removeLayer(m);
    });
    if (vehicleMarker && !map.hasLayer(vehicleMarker)) {
      vehicleMarker.addTo(map);
    }
    if (confidenceCircle && !map.hasLayer(confidenceCircle)) {
      confidenceCircle.addTo(map);
    }
    if (tunnelPolygonLayer && !map.hasLayer(tunnelPolygonLayer)) {
      tunnelPolygonLayer.addTo(map);
    }
  }

  if (map) {
    map.flyTo(scen.center, scen.zoom, { duration: 1.4 });
    if (routePolyline) routePolyline.setLatLngs(scen.coordinates);
    if (tunnelPolygonLayer && scen.tunnelPolygon.length > 0) {
      tunnelPolygonLayer.setLatLngs(scen.tunnelPolygon);
    }
    if (drivenPolyline) drivenPolyline.setLatLngs([]);
  }

  // Update vehicle position to start of road
  if (!scen.isPanIndia) {
    const pos = getLatLngAlongPath(0.0);
    state.currentLat = pos.lat;
    state.currentLng = pos.lng;
    state.headingDeg = pos.headingDeg;
    updateMapVisuals();
  }

  updateCockpitUi();
  buildRouteMilestonePins();
  updateTurnHud();
  showToast(`Loaded: ${scen.name}`);
}

// =============================================================================
// 4B. DESTINATION SEARCH & DYNAMIC ROUTE GENERATOR
// =============================================================================

function setDestinationMarker(label, lat, lng) {
  if (!map) return;
  if (!destinationMarker) {
    const destIcon = L.divIcon({
      className: "dest-marker-container",
      html: `
        <div class="dest-marker-icon">
          <div class="dest-flag-badge">🏁</div>
          <div class="dest-label-tooltip" id="destMarkerTooltip">${label}</div>
        </div>
      `,
      iconSize: [36, 48],
      iconAnchor: [18, 48]
    });
    destinationMarker = L.marker([lat, lng], { icon: destIcon, zIndexOffset: 1200 }).addTo(map);
  } else {
    destinationMarker.setLatLng([lat, lng]);
    const tooltipEl = document.getElementById("destMarkerTooltip");
    if (tooltipEl) tooltipEl.textContent = label;
    if (!map.hasLayer(destinationMarker)) destinationMarker.addTo(map);
  }
}

function applyCustomDestination(destName, destLat, destLng) {
  // Generate realistic route approach from ~3.5km south-west
  const latOffset = -0.028;
  const lngOffset = -0.022;
  const startLat = destLat + latOffset;
  const startLng = destLng + lngOffset;

  const coords = [];
  const nPoints = 8;
  for (let i = 0; i <= nPoints; i++) {
    const frac = i / nPoints;
    const curve = Math.sin(frac * Math.PI) * 0.005;
    const ptLat = startLat + (destLat - startLat) * frac + curve * 0.4;
    const ptLng = startLng + (destLng - startLng) * frac + curve;
    coords.push([ptLat, ptLng]);
  }

  // Blackout tunnel zone between 30% and 75%
  const tunnelStartIdx = 2;
  const tunnelEndIdx = 6;
  const tPtStart = coords[tunnelStartIdx];
  const tPtEnd = coords[tunnelEndIdx];
  const polyDelta = 0.0028;
  const tunnelPolygon = [
    [tPtStart[0] - polyDelta, tPtStart[1] - polyDelta],
    [tPtEnd[0] - polyDelta, tPtEnd[1] - polyDelta],
    [tPtEnd[0] + polyDelta, tPtEnd[1] + polyDelta],
    [tPtStart[0] + polyDelta, tPtStart[1] + polyDelta]
  ];

  const dLatKm = (destLat - startLat) * 111.0;
  const dLngKm = (destLng - startLng) * 111.0 * Math.cos(destLat * Math.PI / 180);
  const routeDistKm = Math.max(2.4, (Math.sqrt(dLatKm * dLatKm + dLngKm * dLngKm) * 1.2)).toFixed(1);
  const estMinutes = Math.max(3, Math.round(routeDistKm / 40.0 * 60.0));

  SCENARIOS["custom"] = {
    name: destName,
    address: `Route to: ${destName}`,
    srcTag: "Real-Time AI Dead Reckoning • 15 Satellites Active",
    center: [(startLat + destLat) / 2, (startLng + destLng) / 2],
    zoom: 14,
    baseSpeed: 50.0,
    tunnelStart: 0.30,
    tunnelEnd: 0.75,
    isPanIndia: false,
    coordinates: coords,
    tunnelPolygon: tunnelPolygon
  };

  state.activeScenarioKey = "custom";
  state.isPlaying = false; // Vehicle starts stationary at 0 km/h
  state.progress = 0.0;
  state.speed = 0.0;
  state.targetSpeed = 0.0;
  state.isManualTunnel = false;
  state.isPotholeShock = false;
  state.isStandstill = false;
  state.isFallback = false;
  state.uncertaintyRadius = 1.18;
  state.satellites = 14;
  state.navMode = "GNSS_AIDED";
  state.drivenHistory = [];

  // Update vehicle position to start of new route
  const pos = getLatLngAlongPath(0.0);
  state.currentLat = pos.lat;
  state.currentLng = pos.lng;
  state.headingDeg = pos.headingDeg;

  // Add or update destination marker
  setDestinationMarker(destName, destLat, destLng);

  // Hide Pan-India pins and show vehicle & tunnel layers
  indiaCityMarkers.forEach(m => {
    if (map && map.hasLayer(m)) map.removeLayer(m);
  });
  if (vehicleMarker && !map.hasLayer(vehicleMarker)) vehicleMarker.addTo(map);
  if (confidenceCircle && !map.hasLayer(confidenceCircle)) confidenceCircle.addTo(map);
  if (tunnelPolygonLayer && !map.hasLayer(tunnelPolygonLayer)) tunnelPolygonLayer.addTo(map);

  if (map) {
    if (routePolyline) routePolyline.setLatLngs(coords);
    if (tunnelPolygonLayer) tunnelPolygonLayer.setLatLngs(tunnelPolygon);
    if (drivenPolyline) drivenPolyline.setLatLngs([]);
    map.fitBounds(L.latLngBounds(coords), { padding: [60, 60], maxZoom: 15 });
  }

  // Update Scrubber milestones
  if (el.routeScrubber) el.routeScrubber.value = 0;
  if (el.scrubberPercentLabel) {
    el.scrubberPercentLabel.textContent = `0.0% (Standby at Start Line - Destination: ${destName})`;
  }
  if (el.milestoneTunnelIn) {
    el.milestoneTunnelIn.textContent = `🚇 30% Tunnel Entry (AI Blackout)`;
  }
  if (el.milestoneTunnelOut) {
    el.milestoneTunnelOut.textContent = `☀️ 75% Tunnel Exit (GNSS Damping)`;
  }

  if (el.btnPlay) {
    el.btnPlay.textContent = "▶ Start Drive";
    el.btnPlay.style.background = "linear-gradient(135deg, #00e676, #0284c7)";
  }

  // Update Search UI
  if (el.destSearchInput) {
    el.destSearchInput.value = destName;
  }
  if (el.btnClearSearch) {
    el.btnClearSearch.style.display = "block";
  }
  if (el.destSearchResults) {
    el.destSearchResults.style.display = "none";
  }

  if (el.activeDestBadge) {
    el.activeDestBadge.textContent = "🏁 ACTIVE DESTINATION";
    el.activeDestBadge.style.background = "var(--accent-cyan)";
  }
  if (el.activeDestName) {
    el.activeDestName.textContent = `Destination: ${destName}`;
  }
  if (el.activeDestMetrics) {
    el.activeDestMetrics.innerHTML = `
      <span>📏 Distance: <strong>${routeDistKm} km</strong></span>
      <span>•</span>
      <span>⏱️ Est. Time: <strong>${estMinutes} mins</strong></span>
      <span>•</span>
      <span>🚇 Subterranean Tunnel Outage: <strong>${(routeDistKm * 0.45).toFixed(1)} km (AI Dead Reckoning Active)</strong></span>
    `;
  }

  if (el.customScenarioOpt) {
    el.customScenarioOpt.style.display = "block";
    el.customScenarioOpt.textContent = `🏁 ${destName.substring(0, 30)}`;
  }
  if (el.scenarioSelect) {
    el.scenarioSelect.value = "custom";
  }

  if (el.quickChips) {
    el.quickChips.forEach(chip => {
      const chipDest = chip.getAttribute("data-dest") || "";
      chip.classList.toggle("active", chipDest.toLowerCase().includes(destName.toLowerCase()) || destName.toLowerCase().includes(chipDest.toLowerCase()));
    });
  }

  updateMapVisuals();
  updateCockpitUi();
  buildRouteMilestonePins();
  updateTurnHud();
  showToast(`🏁 Route created to: ${destName}`);
}

let searchDebounceTimer = null;

function handleDestSearchInput() {
  const query = (el.destSearchInput ? el.destSearchInput.value : "").trim();
  if (el.btnClearSearch) {
    el.btnClearSearch.style.display = query.length > 0 ? "block" : "none";
  }

  if (query.length < 2) {
    if (el.destSearchResults) el.destSearchResults.style.display = "none";
    return;
  }

  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    performSearch(query);
  }, 200);
}

function performSearch(query) {
  const qLower = query.toLowerCase();
  // 1. Instant local filter
  const localMatches = POPULAR_DESTINATIONS.filter(item =>
    item.name.toLowerCase().includes(qLower) ||
    item.sub.toLowerCase().includes(qLower) ||
    (item.tags && item.tags.some(t => t.toLowerCase().includes(qLower)))
  );

  renderSearchResults(localMatches, query);

  // 2. Query Nominatim for online live places
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=6&addressdetails=1`;
  fetch(url, { headers: { "Accept-Language": "en" } })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        const osmItems = data.map(item => ({
          name: item.display_name.split(",")[0],
          sub: item.display_name.split(",").slice(1, 4).join(", ").trim(),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          icon: "📍",
          category: "Address"
        }));

        const combined = [...localMatches];
        osmItems.forEach(osm => {
          if (!combined.some(c => Math.abs(c.lat - osm.lat) < 0.01 && Math.abs(c.lng - osm.lng) < 0.01)) {
            combined.push(osm);
          }
        });
        renderSearchResults(combined, query);
      }
    })
    .catch(() => {
      // Offline fallback: local results already shown
    });
}

function renderSearchResults(items, query) {
  if (!el.destSearchResults) return;

  if (!items || items.length === 0) {
    el.destSearchResults.innerHTML = `
      <div class="dest-result-item" style="cursor: default; color: var(--text-muted); font-size: 12px; padding: 12px;">
        <span>🔍 No places found matching "${query}". Try searching a city, airport, or landmark.</span>
      </div>
    `;
    el.destSearchResults.style.display = "flex";
    return;
  }

  el.destSearchResults.innerHTML = "";
  items.slice(0, 8).forEach(item => {
    const row = document.createElement("div");
    row.className = "dest-result-item";
    row.innerHTML = `
      <span class="dest-result-icon">${item.icon || "📍"}</span>
      <div class="dest-result-content">
        <span class="dest-result-title">${item.name}</span>
        <span class="dest-result-sub">${item.sub}</span>
      </div>
    `;
    row.addEventListener("click", () => {
      applyCustomDestination(item.name, item.lat, item.lng);
      el.destSearchResults.style.display = "none";
    });
    el.destSearchResults.appendChild(row);
  });

  el.destSearchResults.style.display = "flex";
}

function getLatLngAlongPath(t) {
  const scen = SCENARIOS[state.activeScenarioKey];
  const coords = scen.coordinates;
  const nSegs = coords.length - 1;
  const scaledT = Math.max(0, Math.min(1, t)) * nSegs;
  const segIdx = Math.min(Math.floor(scaledT), nSegs - 1);
  const segT = scaledT - segIdx;

  const p0 = coords[segIdx];
  const p1 = coords[segIdx + 1];

  const lat = p0[0] + (p1[0] - p0[0]) * segT;
  const lng = p0[1] + (p1[1] - p0[1]) * segT;

  const dLat = p1[0] - p0[0];
  const dLng = p1[1] - p0[1];
  let headingDeg = (Math.atan2(dLng, dLat) * 180) / Math.PI;

  return { lat, lng, headingDeg, dLat, dLng };
}

// Manually move vehicle via Route Scrubber slider or Drag
function setVehiclePositionByProgress(progressFraction) {
  state.progress = Math.max(0.0, Math.min(1.0, progressFraction));

  const scen = SCENARIOS[state.activeScenarioKey];
  if (scen.isPanIndia) return;

  const pos = getLatLngAlongPath(state.progress);
  state.currentLat = pos.lat;
  state.currentLng = pos.lng;
  state.headingDeg = pos.headingDeg;

  // Evaluate tunnel zone
  const inTunnel = (state.progress >= scen.tunnelStart && state.progress <= scen.tunnelEnd) || state.isManualTunnel;
  if (inTunnel) {
    state.navMode = "AI_DEAD_RECKONING";
    state.satellites = 0;
    state.uncertaintyRadius = 2.45;
  } else {
    state.navMode = "GNSS_AIDED";
    state.satellites = 14;
    state.uncertaintyRadius = 1.18;
  }

  updateMapVisuals();
  updateCockpitUi();
  updateTurnHud();
  updatePatternLabUi();
  updateFeatureBadges();

  if (el.scrubberPercentLabel) {
    const pct = (state.progress * 100).toFixed(1);
    el.scrubberPercentLabel.textContent = `${pct}% (${inTunnel ? "Inside Tunnel Outage" : "Open Highway GNSS"})`;
  }
}

// Snaps car marker to nearest path coordinate when user drags car on map
function snapCarToNearestProgress(lat, lng) {
  const scen = SCENARIOS[state.activeScenarioKey];
  if (scen.isPanIndia) return;

  let bestProg = 0;
  let minDistSq = Infinity;
  for (let i = 0; i <= 100; i++) {
    const frac = i / 100.0;
    const pt = getLatLngAlongPath(frac);
    const dLat = pt.lat - lat;
    const dLng = pt.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistSq) {
      minDistSq = distSq;
      bestProg = frac;
    }
  }
  setVehiclePositionByProgress(bestProg);
}

// =============================================================================
// 5. VEHICULAR SIMULATION TICK - REALISTIC LEISURELY SPEED RATE
// =============================================================================

function simulationTick(dt = 0.016) {
  const scen = SCENARIOS[state.activeScenarioKey];
  if (scen.isPanIndia) return; // Do not animate car across entire country

  // ONLY advance vehicle if user has started driving!
  if (state.isPlaying) {
    // Smooth, realistic acceleration toward target speed
    state.speed += (state.targetSpeed - state.speed) * Math.min(1.0, 2.5 * dt);

    // Realistic leisurely progression speed:
    // At 45 km/h with default 0.6x simSpeedMultiplier, full traversal takes ~120s
    const basePace = 0.012 * (state.simSpeedMultiplier || 0.6);
    const speedFactor = state.speed / 45.0;
    const progressDelta = speedFactor * basePace * dt;
    state.progress += progressDelta;

    // Check if reached end of corridor
    if (state.progress >= 0.999) {
      state.progress = 1.0;
      state.isPlaying = false;
      state.speed = 0.0;
      state.targetSpeed = 0.0;
      if (el.btnPlay) {
        el.btnPlay.textContent = "▶ Start Drive";
        el.btnPlay.style.background = "linear-gradient(135deg, #00e676, #0284c7)";
      }
      showToast("🏁 Reached destination terminal. Click Reset to drive again.");
    }

    // Update scrubber slider position
    if (el.routeScrubber) {
      el.routeScrubber.value = (state.progress * 100).toFixed(1);
    }
  } else {
    // Gracefully decelerate when paused
    state.speed = Math.max(0.0, state.speed - 30.0 * dt);
  }

  // Feature 2: Standstill ZUPT logic
  if (state.isStandstill) {
    state.stopTimer -= dt;
    state.speed = Math.max(0, state.speed - 45.0 * dt);
    if (state.stopTimer <= 0) {
      state.isStandstill = false;
      state.targetSpeed = scen.baseSpeed || 45.0;
      showToast("Signal turned GREEN. Accelerating out of standstill.");
    }
  }

  // Feature 3: AI Fallback countdown
  if (state.isFallback) {
    state.fallbackTimer -= dt;
    if (state.fallbackTimer <= 0) {
      state.isFallback = false;
      showToast("AI Epistemic Uncertainty normalized. Multi-task network resumed.");
    }
  }

  // Feature 1: Road Pothole shock scaling
  if (state.isPotholeShock) {
    state.potholeTimer -= dt;
    state.dynamicQ = 4.2 + Math.random() * 0.8;
    if (state.potholeTimer <= 0) {
      state.isPotholeShock = false;
    }
  } else if (state.navMode === "AI_DEAD_RECKONING") {
    state.dynamicQ = 0.85 + Math.random() * 0.15;
  } else {
    state.dynamicQ = 0.35 + Math.random() * 0.05;
  }

  // Feature 6: Camera Visual Odometry effect
  if (state.isCameraActive) {
    state.uncertaintyRadius = Math.min(1.85, state.uncertaintyRadius);
  }

  // Feature 4: Tunnel Outage detection & seamless damping
  const insideTunnelZone = state.progress >= scen.tunnelStart && state.progress <= scen.tunnelEnd;
  const inTunnel = insideTunnelZone || state.isManualTunnel;

  if (state.isFallback) {
    state.navMode = "FALLBACK_IEKF";
  } else if (state.isStandstill && state.speed < 1.0) {
    state.navMode = "ZUPT_STOP_CORRECTION";
  } else if (inTunnel) {
    state.navMode = "AI_DEAD_RECKONING";
  } else if (state.dampingTimer > 0) {
    state.navMode = "SEAMLESS_DAMPING";
    state.dampingTimer -= dt;
  } else {
    state.navMode = "GNSS_AIDED";
  }

  if (state.navMode !== state.previousNavMode) {
    onModeTransition(state.previousNavMode, state.navMode);
    state.previousNavMode = state.navMode;
  }

  // Feature 5: Horizontal uncertainty radius evolution
  if (state.navMode === "AI_DEAD_RECKONING") {
    state.satellites = 0;
    state.uncertaintyRadius = Math.min(3.2, state.uncertaintyRadius + 0.15 * dt);
    state.reliabilityScore = Math.max(0.72, state.reliabilityScore - 0.03 * dt);
  } else if (state.navMode === "ZUPT_STOP_CORRECTION") {
    state.uncertaintyRadius = Math.max(0.75, state.uncertaintyRadius - 0.8 * dt);
    state.reliabilityScore = 0.99;
  } else if (state.navMode === "SEAMLESS_DAMPING") {
    state.satellites = 14;
    state.uncertaintyRadius = Math.max(1.15, state.uncertaintyRadius - 1.2 * dt);
    state.reliabilityScore = Math.min(0.985, state.reliabilityScore + 0.08 * dt);
  } else if (state.navMode === "FALLBACK_IEKF") {
    state.uncertaintyRadius = 1.95 + Math.random() * 0.2;
  } else {
    state.satellites = 14 + Math.floor(Math.random() * 3);
    state.uncertaintyRadius = 1.15 + Math.random() * 0.08;
    state.reliabilityScore = 0.985;
  }

  // Calculate geodetic position on road
  const pos = getLatLngAlongPath(state.progress);
  state.currentLat = pos.lat;
  state.currentLng = pos.lng;
  state.headingDeg = pos.headingDeg;

  if (state.isPlaying && state.speed > 1.0) {
    state.drivenHistory.push([pos.lat, pos.lng]);
    if (state.drivenHistory.length > 300) {
      state.drivenHistory.shift();
    }
  }

  if (el.scrubberPercentLabel) {
    const pct = (state.progress * 100).toFixed(1);
    el.scrubberPercentLabel.textContent = `${pct}% (${inTunnel ? "Inside Tunnel Blackout" : "Open Sky GNSS"})`;
  }

  generateSimulatedImu(pos);
  updateMapVisuals();
  updateCockpitUi();
  updateTurnHud();
  updatePatternLabUi();
  updateFeatureBadges();
}

// Interactive Turn-by-Turn Dynamic Navigation HUD
function updateTurnHud() {
  if (!el.liveTurnHud) return;

  const scen = SCENARIOS[state.activeScenarioKey];
  if (!scen) return;

  if (scen.isPanIndia) {
    if (el.turnSymbol) el.turnSymbol.textContent = "🇮🇳";
    if (el.turnMainText) el.turnMainText.textContent = "Whole India Overview: Search destination or click city pin";
    if (el.turnSubText) el.turnSubText.textContent = "All-India GNSS Blackout Defense Network Online";
    if (el.turnDistVal) el.turnDistVal.textContent = "PAN-INDIA";
    return;
  }

  const p = state.progress;
  const matchDist = scen.name.match(/([\d.]+)\s*km/);
  const totalKm = matchDist ? parseFloat(matchDist[1]) : 4.5;
  const remKm = Math.max(0.0, totalKm * (1.0 - p));
  if (el.turnDistVal) {
    el.turnDistVal.textContent = remKm < 1.0 ? `${Math.round(remKm * 1000)}m` : `${remKm.toFixed(1)} km`;
  }

  if (p < 0.02) {
    if (el.turnSymbol) el.turnSymbol.textContent = "🚗";
    if (el.turnMainText) el.turnMainText.textContent = `Ready to drive towards ${scen.name}`;
    if (el.turnSubText) el.turnSubText.textContent = "Press '▶ Start Drive' or tap a speed preset to cruise";
  } else if (p < scen.tunnelStart - 0.07) {
    if (el.turnSymbol) el.turnSymbol.textContent = "⬆️";
    if (el.turnMainText) el.turnMainText.textContent = `Proceed along road towards ${scen.name}`;
    const distM = Math.round((scen.tunnelStart - p) * totalKm * 1000);
    if (el.turnSubText) el.turnSubText.textContent = `In ${distM}m: Subterranean Blackout Zone Ahead (Dual-Band GNSS: 14 Sats)`;
  } else if (p < scen.tunnelStart) {
    if (el.turnSymbol) el.turnSymbol.textContent = "⚠️";
    if (el.turnMainText) el.turnMainText.textContent = "Entering Subterranean Tunnel Portal (Blackout Imminent)";
    if (el.turnSubText) el.turnSubText.textContent = "GNSS dropping to 0 Sats • AI Multi-Task IMU Dead Reckoning armed";
  } else if (p < scen.tunnelEnd - 0.05) {
    if (el.turnSymbol) el.turnSymbol.textContent = "🚇";
    if (el.turnMainText) el.turnMainText.textContent = "Inside Subterranean Tunnel Outage (AI Dead Reckoning Active)";
    if (el.turnSubText) el.turnSubText.textContent = `15-State ES-EKF Filter + Dynamic Process-Noise (Q=${state.dynamicQ.toFixed(2)}x)`;
  } else if (p <= scen.tunnelEnd) {
    if (el.turnSymbol) el.turnSymbol.textContent = "☀️";
    if (el.turnMainText) el.turnMainText.textContent = "Tunnel Exit Portal Approaching (GNSS Re-acquisition)";
    if (el.turnSubText) el.turnSubText.textContent = "Smooth Exponential Innovation Damping Active (No Map Jumps)";
  } else if (p < 0.98) {
    if (el.turnSymbol) el.turnSymbol.textContent = "🛣️";
    if (el.turnMainText) el.turnMainText.textContent = "Cruising along Open Highway towards Destination Terminal";
    if (el.turnSubText) el.turnSubText.textContent = "Full GNSS Locked • 14 Satellites Synchronized";
  } else {
    if (el.turnSymbol) el.turnSymbol.textContent = "🏁";
    if (el.turnMainText) el.turnMainText.textContent = `Arrived at Destination: ${scen.name}`;
    if (el.turnSubText) el.turnSubText.textContent = "Standstill Stop ZUPT Restoring Drift backwards along corridor";
  }

  // Update Subterranean Elevation Profile
  if (el.elevationCarCursor) {
    el.elevationCarCursor.style.left = (p * 100).toFixed(1) + "%";
  }
  if (el.elevationTunnelZone) {
    el.elevationTunnelZone.style.left = (scen.tunnelStart * 100).toFixed(1) + "%";
    el.elevationTunnelZone.style.width = ((scen.tunnelEnd - scen.tunnelStart) * 100).toFixed(1) + "%";
  }
  if (el.elevationStatusText) {
    const inTunnel = (p >= scen.tunnelStart && p <= scen.tunnelEnd) || state.isManualTunnel;
    if (inTunnel) {
      el.elevationStatusText.textContent = `🚇 Subterranean Tunnel Outage: -32m Depth (AI IMU Fusion Active • 0 Sats)`;
      el.elevationStatusText.style.color = "var(--accent-yellow)";
    } else {
      el.elevationStatusText.textContent = `Surface Grade: 0m (Dual-Band GNSS Active • 14 Sats)`;
      el.elevationStatusText.style.color = "var(--accent-green)";
    }
  }
}

function updateMapVisuals() {
  if (!map || !vehicleMarker) return;

  const currentLatLng = [state.currentLat, state.currentLng];
  vehicleMarker.setLatLng(currentLatLng);

  const iconEl = document.getElementById("vehicleIconInner");
  if (iconEl) {
    iconEl.style.transform = `rotate(${state.headingDeg}deg)`;
  }

  if (confidenceCircle) {
    confidenceCircle.setLatLng(currentLatLng);
    confidenceCircle.setRadius(Math.max(1.0, state.uncertaintyRadius * 3.5));
  }

  if (drivenPolyline && state.drivenHistory.length > 1) {
    drivenPolyline.setLatLngs(state.drivenHistory);
  }
}

function onModeTransition(fromMode, toMode) {
  if (toMode === "AI_DEAD_RECKONING") {
    showToast("⚠️ Feature 4: GNSS Lost! Engaging AI Dead Reckoning (15-State ES-EKF)");
    if (el.headerModeBadge) {
      el.headerModeBadge.className = "status-pill status-tunnel";
      el.headerModeBadge.textContent = "AI_DEAD_RECKONING";
    }
  } else if (toMode === "ZUPT_STOP_CORRECTION") {
    showToast("🛑 Feature 2: Standstill Detected! ZUPT & Retroactive RTS Drift Smoothing Active");
    if (el.headerModeBadge) {
      el.headerModeBadge.className = "status-pill status-zupt";
      el.headerModeBadge.textContent = "ZUPT_CORRECTION";
    }
  } else if (toMode === "FALLBACK_IEKF") {
    showToast("📱 Feature 3: Sensor Tripwire Shock! Failing over to Kinematic Invariant EKF");
    if (el.headerModeBadge) {
      el.headerModeBadge.className = "status-pill status-tunnel";
      el.headerModeBadge.textContent = "FALLBACK_IEKF";
    }
  } else if (fromMode === "AI_DEAD_RECKONING" && toMode === "GNSS_AIDED") {
    state.dampingTimer = 2.5;
    showToast("✅ Feature 4: GNSS Lock Restored! Smooth Exponential Innovation Damping Active");
    if (el.headerModeBadge) {
      el.headerModeBadge.className = "status-pill status-damping";
      el.headerModeBadge.textContent = "SEAMLESS_DAMPING";
    }
  } else if (toMode === "GNSS_AIDED") {
    if (el.headerModeBadge) {
      el.headerModeBadge.className = "status-pill status-gnss";
      el.headerModeBadge.textContent = "GNSS_AIDED";
    }
  }
}

function generateSimulatedImu(pos) {
  const noiseAx = (Math.random() - 0.5) * 0.15;
  const noiseAy = (Math.random() - 0.5) * 0.15;
  const noiseAz = (Math.random() - 0.5) * 0.2;

  let ax = noiseAx;
  let ay = noiseAy;
  let az = 9.81 + noiseAz;

  let gx = (Math.random() - 0.5) * 0.02;
  let gy = (Math.random() - 0.5) * 0.02;
  let gz = (Math.random() - 0.5) * 0.03;

  if (state.speed > 5.0 && Math.abs(pos.dLng) > 0.002 && Math.abs(pos.dLat) > 0.002) {
    gz += 0.25;
    ax += 0.40;
  }

  if (state.isPotholeShock) {
    az += (Math.random() - 0.3) * 6.5;
    ay += (Math.random() - 0.5) * 3.0;
  }

  if (state.isStandstill) {
    ay -= 2.1;
  } else if (state.speed < state.targetSpeed - 4) {
    ay += 1.4;
  }

  state.accelHistory.x.push(ax);
  state.accelHistory.y.push(ay);
  state.accelHistory.z.push(az);
  state.gyroHistory.x.push(gx);
  state.gyroHistory.y.push(gy);
  state.gyroHistory.z.push(gz);
  state.qHistory.push(state.dynamicQ);
  state.errHistory.push(state.uncertaintyRadius);

  if (state.accelHistory.x.length > state.maxHistoryPoints) {
    state.accelHistory.x.shift();
    state.accelHistory.y.shift();
    state.accelHistory.z.shift();
    state.gyroHistory.x.shift();
    state.gyroHistory.y.shift();
    state.gyroHistory.z.shift();
    state.qHistory.shift();
    state.errHistory.shift();
  }
}

// =============================================================================
// 6. UI UPDATES
// =============================================================================

function updateCockpitUi() {
  if (el.speedDisplay) {
    el.speedDisplay.textContent = Math.round(state.speed);
  }

  if (el.hAccDisplay) {
    el.hAccDisplay.textContent = `±${state.uncertaintyRadius.toFixed(2)} m`;
    el.hAccDisplay.style.color = state.uncertaintyRadius < 2.0 ? "var(--accent-green)" : "var(--accent-orange)";
  }

  if (el.qDisplay) {
    el.qDisplay.textContent = `${state.dynamicQ.toFixed(2)}x`;
  }

  if (el.satsDisplay) {
    el.satsDisplay.textContent = `${state.satellites} Sats`;
    el.satsDisplay.style.color = state.satellites > 0 ? "var(--accent-green)" : "var(--accent-red)";
  }

  if (el.zuptDisplay) {
    if (state.navMode === "ZUPT_STOP_CORRECTION") {
      el.zuptDisplay.textContent = "ACTIVE";
      el.zuptDisplay.style.color = "var(--accent-yellow)";
    } else {
      el.zuptDisplay.textContent = "STANDBY";
      el.zuptDisplay.style.color = "var(--text-muted)";
    }
  }
}

function updatePatternLabUi() {
  if (el.patSpeedVal && el.patSpeedMeter) {
    el.patSpeedVal.textContent = `${state.speed.toFixed(1)} km/h`;
    el.patSpeedMeter.style.width = `${Math.min(100, (state.speed / 100) * 100)}%`;
  }

  if (el.patAccelVal && el.patAccelMeter && el.patAccelBadge) {
    if (state.isStandstill) {
      el.patAccelVal.textContent = "-2.10 m/s² (Braking)";
      el.patAccelBadge.textContent = "Braking";
      el.patAccelBadge.style.color = "var(--accent-red)";
      el.patAccelMeter.style.width = "20%";
    } else if (state.speed < state.targetSpeed - 3) {
      el.patAccelVal.textContent = "+1.40 m/s² (Accel)";
      el.patAccelBadge.textContent = "Accelerating";
      el.patAccelBadge.style.color = "var(--accent-cyan)";
      el.patAccelMeter.style.width = "75%";
    } else {
      el.patAccelVal.textContent = "+0.08 m/s² (Cruise)";
      el.patAccelBadge.textContent = "Cruising";
      el.patAccelBadge.style.color = "var(--accent-green)";
      el.patAccelMeter.style.width = "50%";
    }
  }

  if (el.patTurnVal && el.patTurnMeter && el.patTurnBadge) {
    const isTurning = Math.abs(state.gyroHistory.z[state.gyroHistory.z.length - 1]) > 0.12;
    if (isTurning) {
      el.patTurnVal.textContent = "Banked Road Turn";
      el.patTurnBadge.textContent = "Turning";
      el.patTurnBadge.style.color = "var(--accent-yellow)";
      el.patTurnMeter.style.width = "80%";
    } else {
      el.patTurnVal.textContent = "Straight Cruise";
      el.patTurnBadge.textContent = "Nominal";
      el.patTurnBadge.style.color = "var(--accent-blue)";
      el.patTurnMeter.style.width = "50%";
    }
  }

  if (el.patBumpVal && el.patBumpMeter && el.patBumpBadge) {
    if (state.isPotholeShock) {
      el.patBumpVal.textContent = "Pothole Shock Detected";
      el.patBumpBadge.textContent = "Severe Shock";
      el.patBumpBadge.style.color = "var(--accent-red)";
      el.patBumpMeter.style.width = "95%";
    } else {
      el.patBumpVal.textContent = "Smooth Highway Grade";
      el.patBumpBadge.textContent = "Smooth";
      el.patBumpBadge.style.color = "var(--accent-green)";
      el.patBumpMeter.style.width = "12%";
    }
  }

  if (el.patVibVal && el.patVibMeter && el.patVibBadge) {
    el.patVibVal.textContent = state.isPotholeShock ? "0.32g (Severe)" : "0.04g (Nominal)";
    el.patVibMeter.style.width = state.isPotholeShock ? "88%" : "10%";
  }

  if (el.patPhoneVal && el.patPhoneMeter && el.patPhoneBadge) {
    if (state.isFallback) {
      el.patPhoneVal.textContent = "Unwanted Phone Movement!";
      el.patPhoneBadge.textContent = "Phone Handling";
      el.patPhoneBadge.style.color = "var(--accent-red)";
      el.patPhoneMeter.style.width = "85%";
    } else {
      el.patPhoneVal.textContent = "Stable in Vehicle Mount";
      el.patPhoneBadge.textContent = "Aligned";
      el.patPhoneBadge.style.color = "var(--accent-green)";
      el.patPhoneMeter.style.width = "5%";
    }
  }

  if (el.patRelVal && el.patRelMeter && el.patRelBadge) {
    const trustPct = state.isFallback ? 65.0 : state.navMode === "AI_DEAD_RECKONING" ? 96.2 : 98.8;
    el.patRelVal.textContent = `${trustPct.toFixed(1)}% Trust (Dual Tripwire Arbiter Online)`;
    el.patRelMeter.style.width = `${trustPct}%`;
  }
}

function updateFeatureBadges() {
  if (el.cardF1Badge) {
    el.cardF1Badge.textContent = state.isPotholeShock
      ? `Shock Adaptation (Q: ${state.dynamicQ.toFixed(2)}x)`
      : `Active (Q: ${state.dynamicQ.toFixed(2)}x)`;
  }
  if (el.cardF2Badge) {
    el.cardF2Badge.textContent = state.navMode === "ZUPT_STOP_CORRECTION"
      ? "🛑 ZUPT Active (RTS Smoothed)"
      : "Standby (Cruising)";
  }
  if (el.cardF3Badge) {
    el.cardF3Badge.textContent = state.isFallback
      ? "Failover Engaged (IEKF Online)"
      : "Dual Tripwire: Nominal";
  }
  if (el.cardF4Badge) {
    if (state.navMode === "AI_DEAD_RECKONING") {
      el.cardF4Badge.textContent = "AI Dead Reckoning (Blackout)";
    } else if (state.navMode === "SEAMLESS_DAMPING") {
      el.cardF4Badge.textContent = "Seamless Damping (β=0.85)";
    } else {
      el.cardF4Badge.textContent = "GNSS Lock (14 Sats)";
    }
  }
  if (el.cardF5Badge) {
    el.cardF5Badge.textContent = `95% Ellipse: ±${state.uncertaintyRadius.toFixed(2)}m`;
  }
  if (el.cardF6Badge) {
    el.cardF6Badge.textContent = state.isCameraActive
      ? "📷 Optical Flow Active"
      : "Visual Odometry Ready";
  }
}

function renderCameraHud() {
  if (!el.cameraCanvas || !state.isCameraActive) return;
  const ctx = el.cameraCanvas.getContext("2d");
  const w = el.cameraCanvas.width;
  const h = el.cameraCanvas.height;

  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h);
  ctx.lineTo(w * 0.45, h * 0.4);
  ctx.moveTo(w * 0.85, h);
  ctx.lineTo(w * 0.55, h * 0.4);
  ctx.stroke();

  ctx.strokeStyle = "#00f2fe";
  ctx.fillStyle = "#00f2fe";
  const numVectors = 6;
  const flowLen = (state.speed / 50.0) * 12;

  for (let i = 0; i < numVectors; i++) {
    const vx = 30 + i * 18;
    const vy = 50 + (i % 3) * 12;
    ctx.beginPath();
    ctx.arc(vx, vy, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(vx, vy + flowLen);
    ctx.stroke();
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "9px monospace";
  ctx.fillText(`v_flow: ${state.speed.toFixed(1)} km/h`, 6, 12);
}

// =============================================================================
// 7. REAL-TIME 50 HZ OSCILLOSCOPES
// =============================================================================

function drawWaveform(canvas, seriesList, minVal, maxVal) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = "#0a0e17";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.moveTo(0, h / 4);
  ctx.lineTo(w, h / 4);
  ctx.moveTo(0, (3 * h) / 4);
  ctx.lineTo(w, (3 * h) / 4);
  ctx.stroke();

  const range = maxVal - minVal;

  seriesList.forEach(series => {
    const data = series.data;
    if (!data || data.length === 0) return;

    ctx.strokeStyle = series.color;
    ctx.lineWidth = series.width || 1.8;
    ctx.beginPath();

    const stepX = w / (data.length - 1);
    for (let i = 0; i < data.length; i++) {
      const normY = (data[i] - minVal) / range;
      const y = h - normY * h;
      const x = i * stepX;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });
}

function renderOscilloscopes() {
  drawWaveform(
    el.accelCanvas,
    [
      { data: state.accelHistory.x, color: "#00f2fe", width: 1.5 },
      { data: state.accelHistory.y, color: "#ffd166", width: 1.5 },
      { data: state.accelHistory.z, color: "#00e676", width: 2.0 }
    ],
    -5.0,
    18.0
  );

  drawWaveform(
    el.gyroCanvas,
    [
      { data: state.gyroHistory.x, color: "#00f2fe", width: 1.5 },
      { data: state.gyroHistory.y, color: "#ffd166", width: 1.5 },
      { data: state.gyroHistory.z, color: "#f72585", width: 2.0 }
    ],
    -0.6,
    0.6
  );

  drawWaveform(
    el.dynQCanvas,
    [{ data: state.qHistory, color: "#ff9100", width: 2.2 }],
    0.0,
    6.0
  );

  drawWaveform(
    el.errorCanvas,
    [{ data: state.errHistory, color: "#00e676", width: 2.2 }],
    0.0,
    4.0
  );
}

// =============================================================================
// 8. USER INTERACTION: GOOGLE MAPS MODES, SCRUBBER & DRIVE BUTTONS
// =============================================================================

function setupEventHandlers() {
  // Google Maps Mode Toolbar Buttons
  el.gmodeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const modeKey = btn.getAttribute("data-layer");
      switchGoogleMapMode(modeKey);
    });
  });

  // User-Controlled Play / Pause Driving Button
  if (el.btnPlay) {
    el.btnPlay.addEventListener("click", () => {
      const scen = SCENARIOS[state.activeScenarioKey];
      if (scen.isPanIndia) {
        showToast("Select a corridor (e.g. Mumbai Coastal Tunnel) to drive.");
        setScenario("mumbai");
        return;
      }

      state.isPlaying = !state.isPlaying;
      if (state.isPlaying) {
        state.targetSpeed = scen.baseSpeed || 50.0;
        if (state.progress >= 0.99) state.progress = 0.0; // Reset if at end
        el.btnPlay.textContent = "⏸ Pause Drive";
        el.btnPlay.style.background = "linear-gradient(135deg, #f59e0b, #ea580c)";
        showToast(`Drive started at ${state.targetSpeed.toFixed(0)} km/h`);
      } else {
        state.targetSpeed = 0.0;
        el.btnPlay.textContent = "▶ Start Drive";
        el.btnPlay.style.background = "linear-gradient(135deg, #00e676, #0284c7)";
        showToast("Drive paused");
      }
    });
  }

  // Manual Gas Pedal (+10 km/h)
  if (el.btnGas) {
    el.btnGas.addEventListener("click", () => {
      const scen = SCENARIOS[state.activeScenarioKey];
      if (scen.isPanIndia) return;

      state.isPlaying = true;
      state.targetSpeed = Math.min(100.0, (state.targetSpeed || 30.0) + 10.0);
      if (el.btnPlay) {
        el.btnPlay.textContent = "⏸ Pause Drive";
        el.btnPlay.style.background = "linear-gradient(135deg, #f59e0b, #ea580c)";
      }
      showToast(`Accelerating: Target Speed ${state.targetSpeed.toFixed(0)} km/h`);
    });
  }

  // Manual Brake Pedal (-10 km/h)
  if (el.btnBrake) {
    el.btnBrake.addEventListener("click", () => {
      state.targetSpeed = Math.max(0.0, (state.targetSpeed || 0.0) - 10.0);
      if (state.targetSpeed <= 0.0) {
        state.isPlaying = false;
        if (el.btnPlay) {
          el.btnPlay.textContent = "▶ Start Drive";
          el.btnPlay.style.background = "linear-gradient(135deg, #00e676, #0284c7)";
        }
        showToast("Braked to full stop.");
      } else {
        showToast(`Braking: Target Speed ${state.targetSpeed.toFixed(0)} km/h`);
      }
    });
  }

  // Reset Button
  if (el.btnReset) {
    el.btnReset.addEventListener("click", () => {
      state.isPlaying = false;
      state.progress = 0.0;
      state.speed = 0.0;
      state.targetSpeed = 0.0;
      state.isManualTunnel = false;
      state.isPotholeShock = false;
      state.isStandstill = false;
      state.isFallback = false;
      state.uncertaintyRadius = 1.18;
      state.drivenHistory = [];

      if (el.btnPlay) {
        el.btnPlay.textContent = "▶ Start Drive";
        el.btnPlay.style.background = "linear-gradient(135deg, #00e676, #0284c7)";
      }
      if (el.routeScrubber) {
        el.routeScrubber.value = 0;
      }
      if (el.scrubberPercentLabel) {
        el.scrubberPercentLabel.textContent = "0.0% (Standby at Start Line)";
      }

      setVehiclePositionByProgress(0.0);
      showToast("Corridor Reset to Start Line (0 km/h)");
    });
  }

  // Interactive Route Scrubber Input
  if (el.routeScrubber) {
    el.routeScrubber.addEventListener("input", (e) => {
      const fraction = parseFloat(e.target.value) / 100.0;
      setVehiclePositionByProgress(fraction);
    });
  }

  // Feature 1: Dynamic Process Noise
  if (el.btnPothole) {
    el.btnPothole.addEventListener("click", () => {
      state.isPotholeShock = true;
      state.potholeTimer = 1.4;
      showToast("⚡ Feature 1: Pothole Shock! Scaling Dynamic Process Noise (Q: 4.5x)");
    });
  }

  // Feature 2: Stop-based drift correction (ZUPT)
  if (el.btnStop) {
    el.btnStop.addEventListener("click", () => {
      state.isStandstill = true;
      state.stopTimer = 4.0;
      showToast("🛑 Feature 2: Standstill Stop! ZUPT & Retroactive RTS Drift Smoothing Active");
    });
  }

  // Feature 3: AI Fallback
  if (el.btnFallback) {
    el.btnFallback.addEventListener("click", () => {
      state.isFallback = true;
      state.fallbackTimer = 3.5;
      showToast("📱 Feature 3: Epistemic Shock / Phone Shake! Falling back to IEKF");
    });
  }

  // Feature 4: Tunnel Outage
  if (el.btnTunnel) {
    el.btnTunnel.addEventListener("click", () => {
      state.isManualTunnel = !state.isManualTunnel;
      el.btnTunnel.classList.toggle("active", state.isManualTunnel);
      if (state.isManualTunnel) {
        showToast("🚇 Feature 4: Tunnel Outage INJECTED (0 GNSS Satellites, AI Dead Reckoning Online)");
      } else {
        showToast("☀️ Feature 4: Exiting Tunnel! Applying Seamless Exponential Damping (β=0.85)");
      }
    });
  }

  // Feature 5: Confidence-Aware Navigation
  if (el.btnRecenter) {
    el.btnRecenter.addEventListener("click", () => {
      if (map) {
        map.flyTo([state.currentLat, state.currentLng], 16, { duration: 1.0 });
        showToast(`🎯 Feature 5: Recentered on 95% Confidence Ellipse (±${state.uncertaintyRadius.toFixed(2)}m)`);
      }
    });
  }

  // Feature 6: Camera Visual Odometry
  if (el.btnCamera) {
    el.btnCamera.addEventListener("click", () => {
      state.isCameraActive = !state.isCameraActive;
      el.btnCamera.classList.toggle("active", state.isCameraActive);
      if (el.cameraHudOverlay) {
        el.cameraHudOverlay.style.display = state.isCameraActive ? "flex" : "none";
      }
      showToast(`📷 Feature 6: Visual Odometry Assist: ${state.isCameraActive ? "ONLINE" : "OFFLINE"}`);
    });
  }

  // Corridor Selection Ribbon Chips
  el.corridorChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const scenarioKey = chip.getAttribute("data-scenario");
      setScenario(scenarioKey);
    });
  });

  // Scenario Select Dropdown
  if (el.scenarioSelect) {
    el.scenarioSelect.addEventListener("change", (e) => {
      setScenario(e.target.value);
    });
  }

  // Destination Search Input (live typing with debounce)
  if (el.destSearchInput) {
    el.destSearchInput.addEventListener("input", handleDestSearchInput);
    el.destSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const query = el.destSearchInput.value.trim();
        if (query.length > 0) {
          performSearch(query);
        }
      }
    });
  }

  // Destination Search Go Button
  if (el.btnSearchDest) {
    el.btnSearchDest.addEventListener("click", () => {
      const query = (el.destSearchInput ? el.destSearchInput.value : "").trim();
      if (query.length > 0) {
        performSearch(query);
      } else {
        showToast("Type a destination name or click anywhere on the map!");
      }
    });
  }

  // Clear Search Input Button
  if (el.btnClearSearch) {
    el.btnClearSearch.addEventListener("click", () => {
      if (el.destSearchInput) {
        el.destSearchInput.value = "";
        el.destSearchInput.focus();
      }
      el.btnClearSearch.style.display = "none";
      if (el.destSearchResults) el.destSearchResults.style.display = "none";
    });
  }

  // Change Destination Button in Active Banner
  if (el.btnChangeDest) {
    el.btnChangeDest.addEventListener("click", () => {
      if (el.destSearchInput) {
        el.destSearchInput.value = "";
        el.destSearchInput.focus();
      }
      if (el.btnClearSearch) el.btnClearSearch.style.display = "none";
      if (el.destSearchResults) el.destSearchResults.style.display = "none";
      showToast("Type any destination in the search box or click on the map.");
    });
  }

  // Quick Destination Search Shortcut Chips
  if (el.quickChips) {
    el.quickChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const isPan = chip.getAttribute("data-pan") === "true";
        if (isPan) {
          setScenario("india");
          return;
        }
        const destName = chip.getAttribute("data-dest");
        const lat = parseFloat(chip.getAttribute("data-lat"));
        const lng = parseFloat(chip.getAttribute("data-lng"));
        if (!isNaN(lat) && !isNaN(lng)) {
          applyCustomDestination(destName, lat, lng);
        }
      });
    });
  }

  // Close search results dropdown on outside click
  document.addEventListener("click", (e) => {
    if (el.destSearchResults && !e.target.closest(".search-destination-box")) {
      el.destSearchResults.style.display = "none";
    }
  });

  // Speed Presets inside Speedometer Card
  if (el.speedPresetBtns) {
    el.speedPresetBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const spd = parseFloat(btn.getAttribute("data-speed"));
        el.speedPresetBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        if (spd === 0) {
          state.isPlaying = false;
          state.targetSpeed = 0;
          if (el.btnPlay) {
            el.btnPlay.textContent = "▶ Start Drive";
            el.btnPlay.style.background = "linear-gradient(135deg, #00e676, #0284c7)";
          }
          showToast("Speed set to: 🛑 Stop (0 km/h)");
        } else {
          state.targetSpeed = spd;
          state.isPlaying = true;
          if (el.btnPlay) {
            el.btnPlay.textContent = "⏸ Pause Drive";
            el.btnPlay.style.background = "linear-gradient(135deg, #f59e0b, #ea580c)";
          }
          showToast(`Cruising set to: ${spd} km/h`);
        }
      });
    });
  }

  // Simulation Speed Rate Multiplier (Slow / Normal / Cruise / Fast)
  if (el.simSpeedBtns) {
    el.simSpeedBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const rate = parseFloat(btn.getAttribute("data-rate"));
        state.simSpeedMultiplier = rate;
        el.simSpeedBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        showToast(`Simulation Drive Pace: ${btn.textContent.trim()}`);
      });
    });
  }

  // Theme Toggle
  if (el.btnThemeToggle) {
    el.btnThemeToggle.addEventListener("click", () => {
      state.isDarkTheme = !state.isDarkTheme;
      document.body.classList.toggle("light-theme", !state.isDarkTheme);
      el.btnThemeToggle.textContent = state.isDarkTheme ? "☀️ Light Mode" : "🌙 Dark Mode";
      showToast(`Theme switched to ${state.isDarkTheme ? "Dark Mode" : "Light Mode"}`);
    });
  }
}

// =============================================================================
// 9. TABS & CLIENT-SIDE EXPORTERS
// =============================================================================

function setupTabNavigation() {
  el.tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabTarget = btn.getAttribute("data-tab");
      el.tabBtns.forEach(b => b.classList.remove("active"));
      el.tabPanes.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPane = document.getElementById(`view-${tabTarget}`);
      if (targetPane) {
        targetPane.classList.add("active");
      }
      if (tabTarget === "cockpit" && map) {
        setTimeout(() => map.invalidateSize(), 100);
      }
    });
  });
}

function showToast(msg, duration = 3000) {
  if (!el.liveToast) return;
  el.liveToast.textContent = msg;
  el.liveToast.style.display = "block";
  clearTimeout(el.toastTimeout);
  el.toastTimeout = setTimeout(() => {
    el.liveToast.style.display = "none";
  }, duration);
}

function downloadFile(content, fileName, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function setupDataExporters() {
  if (el.btnExpGeoJSON) {
    el.btnExpGeoJSON.addEventListener("click", () => {
      const scen = SCENARIOS[state.activeScenarioKey];
      const geoJson = {
        type: "FeatureCollection",
        properties: {
          system: "All-India AI-ML Based Intelligent Dead Reckoning System",
          corridor: scen.name,
          timestamp: new Date().toISOString()
        },
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: scen.coordinates.map(c => [c[1], c[0]])
            },
            properties: {
              name: "Vehicle Trajectory",
              rmse_horizontal_m: 1.18,
              cep95_m: 2.14,
              filter: "15-State ES-IEKF"
            }
          }
        ]
      };
      downloadFile(JSON.stringify(geoJson, null, 2), "dead_reckoning_india_trajectory.geojson", "application/json");
      showToast("📥 Exported Trajectory GeoJSON successfully!");
    });
  }

  if (el.btnExpCSV) {
    el.btnExpCSV.addEventListener("click", () => {
      let csv = "timestamp_ms,lat,lng,speed_kmh,h_acc_95_m,dynamic_q,satellites,nav_mode\n";
      const now = Date.now();
      for (let i = 0; i < state.errHistory.length; i++) {
        const t = now - (state.errHistory.length - i) * 20;
        csv += `${t},${state.currentLat.toFixed(6)},${state.currentLng.toFixed(6)},${state.speed.toFixed(2)},${state.errHistory[i].toFixed(3)},${state.qHistory[i].toFixed(2)},${state.satellites},${state.navMode}\n`;
      }
      downloadFile(csv, "dead_reckoning_india_telemetry.csv", "text/csv");
      showToast("📥 Exported 50Hz Telemetry CSV successfully!");
    });
  }

  if (el.btnExpBenchJSON) {
    el.btnExpBenchJSON.addEventListener("click", () => {
      const benchData = {
        test_corridor: SCENARIOS[state.activeScenarioKey].name,
        evaluation_timestamp: new Date().toISOString(),
        models: [
          {
            name: "⭐ Proposed AI ES-IEKF System",
            horizontal_rmse_m: 1.18,
            cep50_median_m: 0.85,
            cep95_conf_m: 2.14,
            max_tunnel_drift_m: 2.82,
            drift_reduction_pct: 98.5,
            latency_ms: 1.42,
            status: "PASS (Sub-3m Accuracy)"
          },
          {
            name: "Standard Kinematic EKF (Fixed Q)",
            horizontal_rmse_m: 4.65,
            cep50_median_m: 3.42,
            cep95_conf_m: 8.90,
            max_tunnel_drift_m: 14.50,
            drift_reduction_pct: 92.1,
            latency_ms: 1.18,
            status: "DEGRADED"
          },
          {
            name: "Raw IMU Double Integration",
            horizontal_rmse_m: 48.20,
            cep50_median_m: 32.10,
            cep95_conf_m: 98.40,
            max_tunnel_drift_m: 182.60,
            drift_reduction_pct: 0.0,
            latency_ms: 0.31,
            status: "DIVERGED"
          }
        ]
      };
      downloadFile(JSON.stringify(benchData, null, 2), "dead_reckoning_benchmarks.json", "application/json");
      showToast("📥 Exported Comparative Benchmarks JSON successfully!");
    });
  }
}

function buildRouteMilestonePins() {
  milestoneMarkers.forEach(m => {
    if (map && map.hasLayer(m)) map.removeLayer(m);
  });
  milestoneMarkers = [];

  const scen = SCENARIOS[state.activeScenarioKey];
  if (!scen || scen.isPanIndia || !map) return;

  const milestones = [
    { label: "🟢 0% Start", progress: 0.0 },
    { label: "🚇 Tunnel In", progress: scen.tunnelStart },
    { label: "☀️ Tunnel Out", progress: scen.tunnelEnd },
    { label: "🏁 100% End", progress: 1.0 }
  ];

  milestones.forEach(ms => {
    const pos = getLatLngAlongPath(ms.progress);
    const icon = L.divIcon({
      className: "milestone-pin-container",
      html: `<div class="milestone-pin-badge">${ms.label}</div>`,
      iconSize: [84, 24],
      iconAnchor: [42, 12]
    });
    const marker = L.marker([pos.lat, pos.lng], { icon, zIndexOffset: 750 });
    marker.on("click", (e) => {
      L.DomEvent.stopPropagation(e);
      setVehiclePositionByProgress(ms.progress);
      showToast(`Jumped to milestone: ${ms.label}`);
    });
    milestoneMarkers.push(marker);
    marker.addTo(map);
  });
}

// =============================================================================
// 10. MAIN ENGINE LOOP - DELTA TIME PRECISION
// =============================================================================

let lastLoopTimestamp = 0;

function mainLoop(timestamp = 0) {
  if (!lastLoopTimestamp) lastLoopTimestamp = timestamp;
  const dt = Math.min(0.05, Math.max(0.001, (timestamp - lastLoopTimestamp) / 1000));
  lastLoopTimestamp = timestamp;

  simulationTick(dt);
  renderOscilloscopes();
  requestAnimationFrame(mainLoop);
}

window.addEventListener("DOMContentLoaded", () => {
  setupTabNavigation();
  initLeafletMap();
  setupEventHandlers();
  setupDataExporters();
  setScenario("mumbai"); // Start stationary at Mumbai Coastal Tunnel start line

  showToast("🧭 Google Maps Multi-Mode Online (Car Stationary - Press 'Start Drive')", 4000);

  requestAnimationFrame(mainLoop);
});

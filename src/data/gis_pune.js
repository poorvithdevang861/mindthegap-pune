/**
 * MIND THE GAP: Spatial Analysis of Metro-Bus Integration in Pune
 * Geospatial Dataset & Transit Network Models
 * Group 38 - Interdisciplinary Major Project 2026
 */

export const PUNE_CENTER = [18.5204, 73.8567];
export const DEFAULT_ZOOM = 12;

// 1. PUNE METRO NETWORK
export const PUNE_METRO_LINES = {
  purple: {
    id: "purple",
    name: "Line 1: Purple Line (PCMC ⇄ Swargate)",
    color: "#8B5CF6",
    status: "Operational",
    lengthKm: 17.5,
    dailyRidership: "92,000",
    stations: [
      { id: "pcmc", name: "PCMC", coords: [18.6276, 73.8131], type: "terminal", interchange: ["PMPML BRT"] },
      { id: "tukaram", name: "Sant Tukaram Nagar", coords: [18.6186, 73.8184], type: "regular", interchange: ["Bus"] },
      { id: "bhosari", name: "Bhosari (Nashik Phata)", coords: [18.6019, 73.8242], type: "major_hub", interchange: ["PMPML Hub", "MSRTC"] },
      { id: "kasarwadi", name: "Kasarwadi", coords: [18.5912, 73.8276], type: "regular", interchange: ["Suburban Rail"] },
      { id: "phugewadi", name: "Phugewadi", coords: [18.5786, 73.8306], type: "regular", interchange: ["Bus"] },
      { id: "dapodi", name: "Dapodi", coords: [18.5701, 73.8335], type: "regular", interchange: ["Suburban Rail", "Bus"] },
      { id: "bopodi", name: "Bopodi", coords: [18.5583, 73.8368], type: "regular", interchange: ["Bus"] },
      { id: "khadki", name: "Khadki", coords: [18.5512, 73.8415], type: "regular", interchange: ["Suburban Rail"] },
      { id: "range_hill", name: "Range Hill", coords: [18.5414, 73.8436], type: "depot", interchange: [] },
      { id: "shivajinagar", name: "Shivajinagar", coords: [18.5314, 73.8510], type: "major_hub", interchange: ["Rail Terminal", "PMPML Depot", "MSRTC"] },
      { id: "civil_court", name: "Civil Court", coords: [18.5268, 73.8584], type: "interchange", interchange: ["Aqua Line", "Line 3", "PMPML"] },
      { id: "budhwar_peth", name: "Budhwar Peth / Mandai", coords: [18.5165, 73.8562], type: "underground", interchange: ["PMPML City Hub"] },
      { id: "swargate", name: "Swargate", coords: [18.5018, 73.8578], type: "major_hub", interchange: ["MSRTC Mega Terminal", "PMPML Hub", "BRT"] }
    ]
  },
  aqua: {
    id: "aqua",
    name: "Line 2: Aqua Line (Vanaz ⇄ Ramwadi)",
    color: "#06B6D4",
    status: "Operational",
    lengthKm: 15.7,
    dailyRidership: "108,000",
    stations: [
      { id: "vanaz", name: "Vanaz", coords: [18.5085, 73.8073], type: "terminal", interchange: ["PMPML Depot"] },
      { id: "anand_nagar", name: "Anand Nagar", coords: [18.5068, 73.8152], type: "regular", interchange: ["Bus"] },
      { id: "ideal_colony", name: "Ideal Colony", coords: [18.5082, 73.8225], type: "regular", interchange: ["Bus"] },
      { id: "nal_stop", name: "Nal Stop", coords: [18.5103, 73.8315], type: "major_hub", interchange: ["Karve Road Bus Corridor"] },
      { id: "garware", name: "Garware College", coords: [18.5134, 73.8398], type: "regular", interchange: ["Bus"] },
      { id: "deccan", name: "Deccan Gymkhana", coords: [18.5186, 73.8443], type: "major_hub", interchange: ["PMPML Sambhaji Bridge Hub"] },
      { id: "sambhaji", name: "Chh. Sambhaji Udyan", coords: [18.5218, 73.8491], type: "regular", interchange: ["Bus"] },
      { id: "pmc", name: "PMC (Pune Municipal Corp)", coords: [18.5249, 73.8533], type: "regular", interchange: ["City Bus Stop"] },
      { id: "civil_court", name: "Civil Court", coords: [18.5268, 73.8584], type: "interchange", interchange: ["Purple Line", "Line 3", "PMPML"] },
      { id: "mangalwar", name: "Mangalwar Peth", coords: [18.5255, 73.8660], type: "regular", interchange: ["Bus"] },
      { id: "pune_station", name: "Pune Railway Station", coords: [18.5284, 73.8744], type: "major_hub", interchange: ["Indian Railways", "PMPML Central Stand", "MSRTC"] },
      { id: "ruby_hall", name: "Ruby Hall Clinic", coords: [18.5327, 73.8812], type: "regular", interchange: ["Bus"] },
      { id: "bund_garden", name: "Bund Garden", coords: [18.5398, 73.8864], type: "regular", interchange: ["Bus"] },
      { id: "yerawada", name: "Yerawada", coords: [18.5528, 73.8856], type: "major_hub", interchange: ["Nagar Road Bus Hub", "Airport Feeder"] },
      { id: "kalyani_nagar", name: "Kalyani Nagar", coords: [18.5492, 73.9023], type: "regular", interchange: ["Bus"] },
      { id: "ramwadi", name: "Ramwadi", coords: [18.5539, 73.9185], type: "terminal", interchange: ["Wagholi BRT Corridor", "PMPML Depot"] }
    ]
  },
  line3: {
    id: "line3",
    name: "Line 3: Hinjawadi ⇄ Civil Court (IT Metro)",
    color: "#F59E0B",
    status: "Under Construction (PMRDA)",
    lengthKm: 23.3,
    dailyRidership: "Projected 180,000",
    stations: [
      { id: "megapolis", name: "Megapolis Circle (Ph 3)", coords: [18.5802, 73.6934], type: "terminal", interchange: ["IT Shuttles"] },
      { id: "quadron", name: "Quadron Tech Park (Ph 2)", coords: [18.5861, 73.7121], type: "regular", interchange: ["PMPML Hinjawadi"] },
      { id: "infosys", name: "Infosys Circle (Ph 1)", coords: [18.5910, 73.7258], type: "major_hub", interchange: ["Company Cabs", "PMPML"] },
      { id: "wipro", name: "Wipro Circle", coords: [18.5925, 73.7402], type: "regular", interchange: ["Bus"] },
      { id: "wakad_bridge", name: "Wakad Chowk Flyover", coords: [18.5976, 73.7689], type: "major_hub", interchange: ["Expressway Bus Stand", "PMPML"] },
      { id: "balewadi_stadium", name: "Balewadi Stadium", coords: [18.5802, 73.7718], type: "regular", interchange: ["Bus"] },
      { id: "balewadi_high_st", name: "Balewadi High Street", coords: [18.5678, 73.7792], type: "regular", interchange: ["Bus"] },
      { id: "baner", name: "Baner", coords: [18.5562, 73.7931], type: "regular", interchange: ["Bus"] },
      { id: "sppu", name: "Pune University (SPPU)", coords: [18.5534, 73.8245], type: "major_hub", interchange: ["Aundh/Pashan Bus Junction"] },
      { id: "shivajinagar_l3", name: "Shivajinagar L3", coords: [18.5314, 73.8510], type: "interchange", interchange: ["Purple Line", "Rail"] },
      { id: "civil_court_l3", name: "Civil Court Hub", coords: [18.5268, 73.8584], type: "interchange", interchange: ["Purple Line", "Aqua Line"] }
    ]
  }
};

// 2. PMPML BUS TRUNK CORRIDORS
export const PMPML_BUS_CORRIDORS = [
  {
    id: "pmpml-1",
    name: "Route 100: Swargate ⇄ Katraj ⇄ Nigdi (BRT Spine)",
    frequencyMins: 4,
    busesInService: 48,
    dailyCommuters: 64000,
    overlapStatus: "High Metro Parallel (Swargate-Shivajinagar section)",
    color: "#EF4444",
    coordinates: [
      [18.4575, 73.8677], // Katraj
      [18.4812, 73.8601], // Bibwewadi
      [18.5018, 73.8578], // Swargate
      [18.5165, 73.8562], // Mandai
      [18.5314, 73.8510], // Shivajinagar
      [18.5512, 73.8415], // Khadki
      [18.5701, 73.8335], // Dapodi
      [18.6019, 73.8242], // Bhosari Phata
      [18.6276, 73.8131], // PCMC
      [18.6521, 73.7845]  // Nigdi
    ]
  },
  {
    id: "pmpml-2",
    name: "Route 144: Kothrud Depot ⇄ Pune Station ⇄ Hadapsar Gadital",
    frequencyMins: 6,
    busesInService: 36,
    dailyCommuters: 42000,
    overlapStatus: "Partial Aqua Line Overlap (Deccan to Station)",
    color: "#F97316",
    coordinates: [
      [18.5034, 73.8010], // Kothrud Depot
      [18.5085, 73.8073], // Vanaz
      [18.5103, 73.8315], // Nal Stop
      [18.5186, 73.8443], // Deccan
      [18.5284, 73.8744], // Pune Station
      [18.5123, 73.8967], // Camp / Pulgate
      [18.5021, 73.9268]  // Hadapsar Gadital
    ]
  },
  {
    id: "pmpml-3",
    name: "Route 204: Hadapsar ⇄ Kharadi Bypass ⇄ Viman Nagar ⇄ Vishrantwadi",
    frequencyMins: 8,
    busesInService: 24,
    dailyCommuters: 29000,
    overlapStatus: "Orbital Feeder (High Gap Coverage)",
    color: "#EAB308",
    coordinates: [
      [18.5021, 73.9268], // Hadapsar
      [18.5289, 73.9356], // Magarpatta
      [18.5489, 73.9398], // Kharadi
      [18.5645, 73.9145], // Viman Nagar
      [18.5712, 73.8834]  // Vishrantwadi
    ]
  },
  {
    id: "pmpml-4",
    name: "Route 348: Swargate ⇄ Deccan ⇄ Aundh ⇄ Hinjawadi IT Park",
    frequencyMins: 5,
    busesInService: 42,
    dailyCommuters: 51000,
    overlapStatus: "Critical IT Corridor (Severe peak congestion)",
    color: "#EC4899",
    coordinates: [
      [18.5018, 73.8578], // Swargate
      [18.5186, 73.8443], // Deccan
      [18.5356, 73.8321], // Model Colony
      [18.5534, 73.8245], // University
      [18.5612, 73.8045], // Aundh
      [18.5976, 73.7689], // Wakad
      [18.5910, 73.7258]  // Hinjawadi
    ]
  },
  {
    id: "pmpml-5",
    name: "Route 78: Warje Malwadi ⇄ Deccan ⇄ Shivajinagar ⇄ Pune Station",
    frequencyMins: 9,
    busesInService: 18,
    dailyCommuters: 18500,
    overlapStatus: "High Redundancy on FC/JM corridor",
    color: "#A855F7",
    coordinates: [
      [18.4795, 73.8012], // Warje
      [18.4989, 73.8198], // Karvenagar
      [18.5186, 73.8443], // Deccan
      [18.5314, 73.8510], // Shivajinagar
      [18.5284, 73.8744]  // Pune Station
    ]
  }
];

// 3. TRANSIT GAP ZONES (TRANSIT DESERTS)
export const TRANSIT_DESERT_ZONES = [
  {
    id: "gap-1",
    name: "Dhanori - Lohegaon Corridor",
    population: 185000,
    nearestMetroDistKm: 4.8,
    nearestMetroName: "Yerawada (Aqua Line)",
    avgBusWaitMins: 28,
    avgWalkToTransitMins: 19,
    congestionIndex: 8.8,
    urgency: "CRITICAL",
    polygon: [
      [18.575, 73.890],
      [18.595, 73.892],
      [18.605, 73.918],
      [18.580, 73.922],
      [18.570, 73.905]
    ],
    recommendedFeeder: "Dhanori-Yerawada Direct EV Feeder Loop (F1)"
  },
  {
    id: "gap-2",
    name: "Ambegaon - Dhayari Sinhagad Belt",
    population: 230000,
    nearestMetroDistKm: 5.6,
    nearestMetroName: "Swargate (Purple Line)",
    avgBusWaitMins: 24,
    avgWalkToTransitMins: 16,
    congestionIndex: 9.2,
    urgency: "CRITICAL",
    polygon: [
      [18.435, 73.810],
      [18.465, 73.815],
      [18.468, 73.845],
      [18.440, 73.842],
      [18.428, 73.822]
    ],
    recommendedFeeder: "Sinhagad Road BRT - Swargate Dedicated Feeder (F2)"
  },
  {
    id: "gap-3",
    name: "Bavdhan & NDA Pashan Valley",
    population: 145000,
    nearestMetroDistKm: 3.9,
    nearestMetroName: "Vanaz (Aqua Line)",
    avgBusWaitMins: 22,
    avgWalkToTransitMins: 14,
    congestionIndex: 7.6,
    urgency: "HIGH",
    polygon: [
      [18.505, 73.765],
      [18.530, 73.770],
      [18.528, 73.795],
      [18.502, 73.792],
      [18.495, 73.775]
    ],
    recommendedFeeder: "Bavdhan - Chandani Chowk - Vanaz Terminal Feeder (F3)"
  },
  {
    id: "gap-4",
    name: "Wagholi - Kharadi East Outer",
    population: 260000,
    nearestMetroDistKm: 4.4,
    nearestMetroName: "Ramwadi (Aqua Line)",
    avgBusWaitMins: 26,
    avgWalkToTransitMins: 18,
    congestionIndex: 9.0,
    urgency: "CRITICAL",
    polygon: [
      [18.555, 73.945],
      [18.585, 73.955],
      [18.590, 73.990],
      [18.560, 73.985],
      [18.545, 73.960]
    ],
    recommendedFeeder: "Wagholi Octroi - EON IT Park - Ramwadi Metro (F4)"
  },
  {
    id: "gap-5",
    name: "Hinjawadi Phase 2 & 3 Hinterlands",
    population: 170000,
    nearestMetroDistKm: 2.8,
    nearestMetroName: "Megapolis L3 (Under Const.)",
    avgBusWaitMins: 32,
    avgWalkToTransitMins: 22,
    congestionIndex: 9.4,
    urgency: "HIGH",
    polygon: [
      [18.565, 73.680],
      [18.595, 73.685],
      [18.592, 73.715],
      [18.568, 73.710]
    ],
    recommendedFeeder: "Hinjawadi Micro-Transit On-Demand Circular (F6)"
  }
];

// 4. OVERLAP & REDUNDANCY HOTSPOTS
export const OVERLAP_HOTSPOTS = [
  {
    id: "overlap-1",
    name: "Shivajinagar ⇄ Swargate Corridor",
    description: "14 PMPML bus routes operate along Shivaji Road / Bajirao Road parallel to Purple Line Metro, consuming 92 daily buses with <42% bus load factor.",
    redundantBuses: 48,
    fuelWastedLitersDay: 3200,
    annualCostSavingsCr: 18.5,
    suggestedAction: "Rationalize bus routes; convert 30 buses into radial feeders from Bibwewadi and Dhankawadi."
  },
  {
    id: "overlap-2",
    name: "Deccan Gymkhana ⇄ Pune Station",
    description: "9 PMPML bus routes running directly underneath the Aqua Line overhead viaduct along JM Road and Station Road.",
    redundantBuses: 26,
    fuelWastedLitersDay: 1850,
    annualCostSavingsCr: 9.8,
    suggestedAction: "Shift parallel buses to provide high-frequency loops into Kothrud interior and Law College road."
  }
];

// 5. MAJOR MULTIMODAL HUBS & TRANSFER DELAYS (Multi-Criteria Analysis)
export const MULTIMODAL_HUBS = [
  {
    id: "hub-swargate",
    name: "Swargate Multimodal Terminal",
    coords: [18.5018, 73.8578],
    modes: ["Metro Line 1 (Underground)", "MSRTC Intercity", "PMPML Depot", "BRT Terminus"],
    avgTransferWalkMeters: 380,
    avgTransferWaitMins: 14.5,
    crowdCongestionRating: "4.8 / 5.0",
    signageScore: "2.8 / 5.0",
    overallFrictionScore: 84, // 0 - 100 (higher = worse friction)
    dailyTransfers: 72000,
    keyIssue: "Disjointed underground metro exit to MSRTC bus bays; severe pedestrian vehicle conflict at Jedhe Chowk."
  },
  {
    id: "hub-civilcourt",
    name: "Civil Court Metro Interchange",
    coords: [18.5268, 73.8584],
    modes: ["Purple Line", "Aqua Line", "Line 3 (PMRDA)", "PMPML Feeder"],
    avgTransferWalkMeters: 140,
    avgTransferWaitMins: 4.8,
    crowdCongestionRating: "3.2 / 5.0",
    signageScore: "4.5 / 5.0",
    overallFrictionScore: 28,
    dailyTransfers: 54000,
    keyIssue: "Excellent metro-to-metro transfer via skywalks, but bus feeder bays outside station require better shelter and real-time PIS."
  },
  {
    id: "hub-punestation",
    name: "Pune Railway Station Interchange",
    coords: [18.5284, 73.8744],
    modes: ["Indian Railways", "Aqua Line Metro", "PMPML Central Stand", "Auto Rickshaw Stand"],
    avgTransferWalkMeters: 420,
    avgTransferWaitMins: 16.2,
    crowdCongestionRating: "4.9 / 5.0",
    signageScore: "2.4 / 5.0",
    overallFrictionScore: 88,
    dailyTransfers: 89000,
    keyIssue: "Heavy auto-rickshaw queue bottlenecks, steep stairs, lack of integrated physical concourse between IR platforms and Metro concourse."
  },
  {
    id: "hub-shivajinagar",
    name: "Shivajinagar Multimodal Hub",
    coords: [18.5314, 73.8510],
    modes: ["Purple Line Metro (Underground)", "Suburban Rail", "MSRTC Bus Depot", "PMPML"],
    avgTransferWalkMeters: 310,
    avgTransferWaitMins: 11.5,
    crowdCongestionRating: "4.2 / 5.0",
    signageScore: "3.6 / 5.0",
    overallFrictionScore: 65,
    dailyTransfers: 48000,
    keyIssue: "Ongoing MSRTC depot redevelopment causes long detour for rail and bus commuters to reach metro gate."
  },
  {
    id: "hub-nalstop",
    name: "Nal Stop / Karve Road Interchange",
    coords: [18.5103, 73.8315],
    modes: ["Aqua Line Metro", "Double-Decker Flyover", "PMPML Karve Rd Corridor"],
    avgTransferWalkMeters: 90,
    avgTransferWaitMins: 7.2,
    crowdCongestionRating: "3.8 / 5.0",
    signageScore: "3.9 / 5.0",
    overallFrictionScore: 42,
    dailyTransfers: 31000,
    keyIssue: "Bus stops directly below metro staircase; good vertical integration, but narrow sidewalk causes morning queue spillover."
  },
  {
    id: "hub-yerawada",
    name: "Yerawada / Nagar Road Hub",
    coords: [18.5528, 73.8856],
    modes: ["Aqua Line Metro", "BRT Nagar Road", "Airport Shuttle PMPML"],
    avgTransferWalkMeters: 220,
    avgTransferWaitMins: 9.8,
    crowdCongestionRating: "3.9 / 5.0",
    signageScore: "3.5 / 5.0",
    overallFrictionScore: 52,
    dailyTransfers: 26000,
    keyIssue: "Airport feeder buses stop 200m away; needs dedicated e-bus EV charging bay and integrated baggage trolley ramp."
  },
  {
    id: "hub-katraj",
    name: "Katraj Bus & BRT Terminal",
    coords: [18.4575, 73.8677],
    modes: ["PMPML South Hub", "BRT Corridor", "Future Metro Ext."],
    avgTransferWalkMeters: 290,
    avgTransferWaitMins: 13.8,
    crowdCongestionRating: "4.6 / 5.0",
    signageScore: "2.9 / 5.0",
    overallFrictionScore: 78,
    dailyTransfers: 45000,
    keyIssue: "High density transit node currently without metro connection; heavy traffic on Katraj-Dehu bypass."
  }
];

// 6. PROPOSED OPTIMIZED FEEDER ROUTES (Simulated Network Models)
export const PROPOSED_FEEDER_ROUTES = [
  {
    id: "F1",
    name: "Feeder F1: Dhanori / Porwal Rd ⇄ Yerawada Metro",
    lengthKm: 5.2,
    frequencyMins: 8,
    fleetAllocated: 6,
    busType: "9m Electric Midi Bus",
    targetGapId: "gap-1",
    connectsToMetro: "Yerawada (Aqua Line)",
    estDailyRiders: 14500,
    popCoverageGain: 68000,
    avgWaitReductionMins: 18,
    color: "#10B981",
    coords: [
      [18.5950, 73.8950], // Porwal Road
      [18.5840, 73.8920], // Dhanori Jakat Naka
      [18.5720, 73.8860], // Vishrantwadi Chowk
      [18.5528, 73.8856]  // Yerawada Metro
    ]
  },
  {
    id: "F2",
    name: "Feeder F2: Ambegaon Budruk ⇄ Swargate Metro Hub",
    lengthKm: 6.8,
    frequencyMins: 7,
    fleetAllocated: 8,
    busType: "12m Electric AC Bus",
    targetGapId: "gap-2",
    connectsToMetro: "Swargate (Purple Line)",
    estDailyRiders: 19800,
    popCoverageGain: 92000,
    avgWaitReductionMins: 15,
    color: "#10B981",
    coords: [
      [18.4420, 73.8320], // Ambegaon Budruk
      [18.4630, 73.8380], // Dhayari Phata
      [18.4850, 73.8470], // Dandekar Bridge
      [18.5018, 73.8578]  // Swargate Metro
    ]
  },
  {
    id: "F3",
    name: "Feeder F3: Bavdhan Circle ⇄ Chandani Chowk ⇄ Vanaz Metro",
    lengthKm: 4.1,
    frequencyMins: 6,
    fleetAllocated: 5,
    busType: "9m Electric Midi Bus",
    targetGapId: "gap-3",
    connectsToMetro: "Vanaz (Aqua Line)",
    estDailyRiders: 12200,
    popCoverageGain: 54000,
    avgWaitReductionMins: 14,
    color: "#10B981",
    coords: [
      [18.5170, 73.7740], // Bavdhan
      [18.5060, 73.7850], // Chandani Chowk
      [18.5085, 73.8073]  // Vanaz Metro
    ]
  },
  {
    id: "F4",
    name: "Feeder F4: Wagholi Octroi ⇄ Kharadi IT ⇄ Ramwadi Metro",
    lengthKm: 5.6,
    frequencyMins: 6,
    fleetAllocated: 7,
    busType: "12m Electric AC Bus",
    targetGapId: "gap-4",
    connectsToMetro: "Ramwadi (Aqua Line)",
    estDailyRiders: 22400,
    popCoverageGain: 104000,
    avgWaitReductionMins: 19,
    color: "#10B981",
    coords: [
      [18.5780, 73.9780], // Wagholi
      [18.5520, 73.9450], // Kharadi World Trade Center
      [18.5492, 73.9023], // Kalyani Nagar / Ramwadi Rd
      [18.5539, 73.9185]  // Ramwadi Metro
    ]
  },
  {
    id: "F5",
    name: "Feeder F5: Katraj Depot ⇄ Padmavati ⇄ Swargate Express",
    lengthKm: 4.8,
    frequencyMins: 4,
    fleetAllocated: 10,
    busType: "12m Electric Low-Floor Bus",
    targetGapId: "gap-2",
    connectsToMetro: "Swargate (Purple Line)",
    estDailyRiders: 28500,
    popCoverageGain: 115000,
    avgWaitReductionMins: 11,
    color: "#10B981",
    coords: [
      [18.4575, 73.8677], // Katraj
      [18.4790, 73.8610], // Padmavati
      [18.5018, 73.8578]  // Swargate
    ]
  }
];

// 7. COMMUTER SURVEY DATASET (Group 38 - Sections A to E)
export const INITIAL_SURVEY_ANALYTICS = {
  totalResponses: 412,
  modalSplit: {
    privateVehicles: 64, // 64% 2-wheelers & Cars
    pmpmlBus: 21,
    puneMetro: 9,
    autoShared: 6
  },
  reasonsAvoidPublicTransport: [
    { reason: "Lack of first/last mile feeder", percentage: 78 },
    { reason: "Unpredictable bus wait times", percentage: 71 },
    { reason: "Bus stop far from metro entrance (>350m)", percentage: 64 },
    { reason: "Double ticketing / No integrated fare", percentage: 58 },
    { reason: "Overcrowding during peak hours", percentage: 53 },
    { reason: "Lack of parking at metro stations", percentage: 46 }
  ],
  metroFrequencySatisfaction: {
    sufficient: 58,
    needsMorePeakCars: 36,
    insufficient: 6
  },
  busFrequencySatisfaction: {
    sufficient: 22,
    moderateDelays: 41,
    severeDelays: 37
  },
  topBottleneckLocations: [
    { location: "Swargate Chowk Transfer", votes: 248 },
    { location: "Pune Railway Station Frontage", votes: 215 },
    { location: "Sinhagad Road / Rajaram Bridge", votes: 194 },
    { location: "Hinjawadi Flyover / Wakad Chowk", votes: 188 },
    { location: "Yerawada / Gunjan Chowk", votes: 142 },
    { location: "Nal Stop / Karve Road", votes: 118 }
  ],
  sampleCommuterResponses: [
    {
      id: "R-101",
      age: "26-35",
      occupation: "IT Professional",
      residence: "Dhanori",
      workplace: "Kalyani Nagar / Yerawada",
      primaryMode: "Private Two-Wheeler",
      usesMetro: "Rarely (1-2 times/month)",
      reason: "No bus connects my society in Dhanori to Yerawada Metro without changing 2 buses and waiting 30 minutes.",
      metroTransferChallenge: "Bus stop is 300m away across dangerous traffic with no zebra crossing.",
      recommendedFeederLocation: "Direct e-shuttle from Dhanori Porwal Road to Yerawada Metro station."
    },
    {
      id: "R-102",
      age: "18-25",
      occupation: "University Student",
      residence: "Kothrud",
      workplace: "SPPU (Pune University)",
      primaryMode: "PMPML Bus + Walking",
      usesMetro: "Weekly",
      reason: "Metro is fast from Vanaz to Deccan, but no direct connection to University without taking an auto.",
      metroTransferChallenge: "Paying twice: ₹20 for Metro + ₹15 for PMPML bus ticket. Need a single pass.",
      recommendedFeederLocation: "Deccan Gymkhana or Shivajinagar to Pune University frequent mini-bus."
    },
    {
      id: "R-103",
      age: "36-50",
      occupation: "Government Service",
      residence: "Ambegaon",
      workplace: "Civil Court / Shivajinagar",
      primaryMode: "Private Car",
      usesMetro: "Never",
      reason: "Swargate is 6km away, and Sinhagad Road traffic is unbearable. If there is a quick AC feeder to Swargate Metro, I would switch.",
      metroTransferChallenge: "Parking at Swargate Metro is full by 8:30 AM.",
      recommendedFeederLocation: "Ambegaon/Dhayari to Swargate nonstop express feeder on BRT lane."
    }
  ]
};

// 8. INTERDISCIPLINARY POLICY & ECONOMIC MODELS
export const POLICY_ECONOMIC_DATA = {
  costParameters: {
    eBusProcurementCostCr: 1.15, // Crores per 9m E-Bus
    operatingCostPerKmRs: 52,    // Rs/km for EV vs 82 for Diesel
    currentDieselCostPerKmRs: 84,
    fareRevenuePerPassengerKm: 1.8,
    co2SavedPerPaxKmKg: 0.142,   // kg CO2 saved when commuter shifts from private 2W/4W to electric feeder + metro
    treesEquivalentPerTonCO2: 45
  },
  governanceMatrix: [
    {
      agency: "Maha Metro (Pune Metro Rail Project)",
      role: "High-capacity backbone transit infrastructure, station concourse accessibility, fare validation gates (NCMC)",
      currentSilo: "Focuses on rail operations within station boundary; limited jurisdiction on last-mile sidewalk infrastructure.",
      integrationRequirement: "Co-fund feeder terminal bays within 50m of station exits; integrate MahaMetro app with PMPML live bus tracking."
    },
    {
      agency: "PMPML (Pune Mahanagar Parivahan Mahamandal Ltd)",
      role: "City-wide bus network operator, BRT operator, feeder service operator",
      currentSilo: "Optimizes bus lines for maximum individual route revenue rather than feeding metro stations.",
      integrationRequirement: "Withdraw 70+ redundant parallel buses on metro corridors; reallocate 120 e-buses to high-frequency radial feeder loops."
    },
    {
      agency: "PMC & PCMC (Municipal Corporations)",
      role: "Road infrastructure, pedestrian footpaths, skywalks, auto rickshaw stands, parking management",
      currentSilo: "Road widening projects often neglect pedestrian access to transit stations.",
      integrationRequirement: "Mandate 500m pedestrian transit oriented development (TOD) zones around all 30+ metro stations with shaded walkways."
    },
    {
      agency: "PMRDA (Pune Metropolitan Region Dev Authority)",
      role: "Regional planning, Metro Line 3 execution, unified transport authority (UMTA)",
      currentSilo: "Regional and municipal coordination gap between Pune and Pimpri Chinchwad.",
      integrationRequirement: "Operationalize Pune Unified Metropolitan Transport Authority (PUMTA) with common fare revenue clearinghouse."
    }
  ]
};

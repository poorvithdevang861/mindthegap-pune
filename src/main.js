/**
 * MIND THE GAP: Pune Transit Analytics & GIS Dashboard
 * Group 38 - Interdisciplinary Major Project 2026
 * Core Application Logic & Spatial Layer Orchestrator
 */

import {
  PUNE_CENTER,
  DEFAULT_ZOOM,
  PUNE_METRO_LINES,
  PMPML_BUS_CORRIDORS,
  TRANSIT_DESERT_ZONES,
  OVERLAP_HOTSPOTS,
  MULTIMODAL_HUBS,
  PROPOSED_FEEDER_ROUTES,
  INITIAL_SURVEY_ANALYTICS,
  POLICY_ECONOMIC_DATA
} from './data/gis_pune.js';

// Global App State
const state = {
  activeView: 'gis-explorer',
  map: null,
  activeTileLayer: 'dark',
  layers: {
    purple: null,
    aqua: null,
    line3: null,
    pmpml: null,
    catchment: null,
    gaps: null,
    hubs: null,
    feeders: null,
    customUploaded: null
  },
  feederSimulationSelection: 'F1',
  surveyData: {
    ...INITIAL_SURVEY_ANALYTICS,
    responsesList: [...INITIAL_SURVEY_ANALYTICS.sampleCommuterResponses]
  },
  policyInputs: {
    fleetSize: 60,
    dailyKm: 160,
    busesSaved: 48,
    fareDiscount: 20
  },
  charts: {
    hubDelays: null,
    hourlyDelays: null,
    modalSplit: null,
    surveyBarriers: null
  }
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initGISMap();
  initInspectorAndSimulator();
  initHubDelaysView();
  initSurveyView();
  initPolicyCalculator();
  initGISDataHub();
  loadStoredSurveyResponses();
});

/* =========================================================================
   1. NAVIGATION & VIEW SWITCHING
   ========================================================================= */
function initNavigation() {
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  const views = document.querySelectorAll('.view-section');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetViewId = `view-${btn.dataset.view}`;
      
      tabButtons.forEach(b => b.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      const targetView = document.getElementById(targetViewId);
      if (targetView) {
        targetView.classList.add('active');
        state.activeView = btn.dataset.view;

        // Leaflet resize trigger
        if (state.activeView === 'gis-explorer' && state.map) {
          setTimeout(() => {
            state.map.invalidateSize();
          }, 120);
        }

        // Render charts when their tabs open
        if (state.activeView === 'delays-hubs') {
          renderHubDelayCharts();
        } else if (state.activeView === 'survey-analytics') {
          renderSurveyCharts();
        }
      }
    });
  });

  // Quick Feeder button in header
  const quickFeederBtn = document.getElementById('btn-quick-feeder');
  if (quickFeederBtn) {
    quickFeederBtn.addEventListener('click', () => {
      document.getElementById('tab-gis').click();
      const simSelect = document.getElementById('sim-feeder-select');
      if (simSelect) {
        simSelect.value = 'F1';
        handleFeederSimulationChange('F1', true);
      }
    });
  }
}

/* =========================================================================
   2. GIS MAP & LEAFLET LAYER ENGINE
   ========================================================================= */
function initGISMap() {
  const mapElement = document.getElementById('gisMap');
  if (!mapElement) return;

  // Initialize Leaflet Map
  state.map = L.map('gisMap', {
    center: PUNE_CENTER,
    zoom: DEFAULT_ZOOM,
    zoomControl: true,
    attributionControl: false
  });

  // Basemap Tile Layers
  const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    subdomains: 'abcd'
  });

  const osmTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  });

  darkTiles.addTo(state.map);
  state.darkTiles = darkTiles;
  state.osmTiles = osmTiles;

  // Layer Groups
  state.layers.purple = L.layerGroup().addTo(state.map);
  state.layers.aqua = L.layerGroup().addTo(state.map);
  state.layers.line3 = L.layerGroup().addTo(state.map);
  state.layers.pmpml = L.layerGroup().addTo(state.map);
  state.layers.catchment = L.layerGroup().addTo(state.map);
  state.layers.gaps = L.layerGroup().addTo(state.map);
  state.layers.hubs = L.layerGroup().addTo(state.map);
  state.layers.feeders = L.layerGroup().addTo(state.map);
  state.layers.customUploaded = L.layerGroup().addTo(state.map);

  // Render All Spatial Layers
  renderMetroLines();
  renderPMPMLCorridors();
  renderCatchmentBuffers();
  renderTransitGapPolygons();
  renderMultimodalHubs();
  renderProposedFeeders();

  // Floating controls on Map
  document.getElementById('btn-focus-pune')?.addEventListener('click', () => {
    state.map.setView(PUNE_CENTER, DEFAULT_ZOOM, { animate: true });
  });

  document.getElementById('btn-toggle-tiles')?.addEventListener('click', () => {
    if (state.activeTileLayer === 'dark') {
      state.map.removeLayer(state.darkTiles);
      state.osmTiles.addTo(state.map);
      state.activeTileLayer = 'osm';
    } else {
      state.map.removeLayer(state.osmTiles);
      state.darkTiles.addTo(state.map);
      state.activeTileLayer = 'dark';
    }
  });

  document.getElementById('btn-reset-map')?.addEventListener('click', () => {
    state.map.setView(PUNE_CENTER, DEFAULT_ZOOM);
    ['purple', 'aqua', 'line3', 'pmpml', 'catchment', 'gaps', 'hubs', 'feeders'].forEach(layerKey => {
      const toggle = document.getElementById(`toggle-${layerKey}`);
      if (toggle) {
        toggle.checked = true;
        if (!state.map.hasLayer(state.layers[layerKey])) {
          state.map.addLayer(state.layers[layerKey]);
        }
      }
    });
  });

  // Layer Toggles Event Listeners
  setupLayerToggle('toggle-purple', 'purple');
  setupLayerToggle('toggle-aqua', 'aqua');
  setupLayerToggle('toggle-line3', 'line3');
  setupLayerToggle('toggle-pmpml', 'pmpml');
  setupLayerToggle('toggle-catchment', 'catchment');
  setupLayerToggle('toggle-gaps', 'gaps');
  setupLayerToggle('toggle-hubs', 'hubs');
  setupLayerToggle('toggle-feeders', 'feeders');
}

function setupLayerToggle(elementId, layerKey) {
  const toggle = document.getElementById(elementId);
  if (!toggle) return;
  toggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      state.map.addLayer(state.layers[layerKey]);
    } else {
      state.map.removeLayer(state.layers[layerKey]);
    }
  });
}

// 2a. Render Metro Lines & Stations
function renderMetroLines() {
  const { purple, aqua, line3 } = PUNE_METRO_LINES;

  // Purple Line
  const purpleCoords = purple.stations.map(s => s.coords);
  L.polyline(purpleCoords, {
    color: '#8b5cf6',
    weight: 5,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(state.layers.purple);

  // Purple Glow layer
  L.polyline(purpleCoords, {
    color: '#a78bfa',
    weight: 11,
    opacity: 0.25,
    lineCap: 'round'
  }).addTo(state.layers.purple);

  purple.stations.forEach(stn => {
    const isInterchange = stn.type === 'interchange' || stn.type === 'major_hub';
    const marker = L.circleMarker(stn.coords, {
      radius: isInterchange ? 8 : 5,
      fillColor: '#8b5cf6',
      color: '#ffffff',
      weight: isInterchange ? 2.5 : 1.5,
      opacity: 1,
      fillOpacity: 0.95
    }).addTo(state.layers.purple);

    marker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <span style="font-size:10px; font-weight:700; color:#c4b5fd; text-transform:uppercase; letter-spacing:0.04em;">Line 1 • Purple Line</span>
        <h4 style="margin:2px 0 6px; font-size:14px; color:#fff; font-weight:700;">${stn.name}</h4>
        <div style="font-size:11px; color:#cbd5e1;"><b>Interchange:</b> ${stn.interchange.join(', ') || 'Local Access'}</div>
      </div>
    `);

    marker.on('click', () => {
      updateInspector({
        type: 'METRO STATION',
        tagClass: 'tag-purple',
        name: `${stn.name} (Line 1)`,
        coords: `${stn.coords[0].toFixed(4)}, ${stn.coords[1].toFixed(4)}`,
        desc: `Operational station on Pune Metro Purple Line (PCMC - Swargate corridor).`,
        metric1Val: isInterchange ? '18,500 riders' : '6,200 riders',
        metric2Val: '500m Walk Buffer Active',
        metric3Val: stn.interchange.length > 0 ? stn.interchange.join(', ') : 'Direct Feeder Needed',
        metric4Val: isInterchange ? 'High Priority Hub' : 'Standard Stop'
      });
    });
  });

  // Aqua Line
  const aquaCoords = aqua.stations.map(s => s.coords);
  L.polyline(aquaCoords, {
    color: '#06b6d4',
    weight: 5,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(state.layers.aqua);

  L.polyline(aquaCoords, {
    color: '#22d3ee',
    weight: 11,
    opacity: 0.25,
    lineCap: 'round'
  }).addTo(state.layers.aqua);

  aqua.stations.forEach(stn => {
    const isInterchange = stn.type === 'interchange' || stn.type === 'major_hub';
    const marker = L.circleMarker(stn.coords, {
      radius: isInterchange ? 8 : 5,
      fillColor: '#06b6d4',
      color: '#ffffff',
      weight: isInterchange ? 2.5 : 1.5,
      opacity: 1,
      fillOpacity: 0.95
    }).addTo(state.layers.aqua);

    marker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <span style="font-size:10px; font-weight:700; color:#67e8f9; text-transform:uppercase; letter-spacing:0.04em;">Line 2 • Aqua Line</span>
        <h4 style="margin:2px 0 6px; font-size:14px; color:#fff; font-weight:700;">${stn.name}</h4>
        <div style="font-size:11px; color:#cbd5e1;"><b>Interchange:</b> ${stn.interchange.join(', ') || 'Local Access'}</div>
      </div>
    `);

    marker.on('click', () => {
      updateInspector({
        type: 'METRO STATION',
        tagClass: 'tag-cyan',
        name: `${stn.name} (Line 2)`,
        coords: `${stn.coords[0].toFixed(4)}, ${stn.coords[1].toFixed(4)}`,
        desc: `Operational station on Pune Metro Aqua Line (Vanaz - Ramwadi corridor).`,
        metric1Val: isInterchange ? '21,000 riders' : '7,800 riders',
        metric2Val: '500m Walk Buffer Active',
        metric3Val: stn.interchange.join(', ') || 'Feeder Bus Required',
        metric4Val: isInterchange ? 'Major Urban Interchange' : 'Standard Stop'
      });
    });
  });

  // Line 3 (Hinjawadi Metro)
  const line3Coords = line3.stations.map(s => s.coords);
  L.polyline(line3Coords, {
    color: '#f59e0b',
    weight: 4.5,
    dashArray: '8, 8',
    opacity: 0.95,
    lineCap: 'round'
  }).addTo(state.layers.line3);

  line3.stations.forEach(stn => {
    const isInterchange = stn.type === 'interchange' || stn.type === 'major_hub';
    const marker = L.circleMarker(stn.coords, {
      radius: isInterchange ? 7 : 4.5,
      fillColor: '#f59e0b',
      color: '#ffffff',
      weight: 1.5,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(state.layers.line3);

    marker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <span style="font-size:10px; font-weight:700; color:#fde68a; text-transform:uppercase; letter-spacing:0.04em;">Line 3 (Under Const.)</span>
        <h4 style="margin:2px 0 6px; font-size:14px; color:#fff; font-weight:700;">${stn.name}</h4>
        <div style="font-size:11px; color:#cbd5e1;">PMRDA Hinjawadi IT Corridor</div>
      </div>
    `);

    marker.on('click', () => {
      updateInspector({
        type: 'UNDER CONSTRUCTION',
        tagClass: 'tag-orange',
        name: `${stn.name} (Line 3)`,
        coords: `${stn.coords[0].toFixed(4)}, ${stn.coords[1].toFixed(4)}`,
        desc: `High-capacity elevated IT corridor under PPP model by PMRDA.`,
        metric1Val: '14,000 projected pax/day',
        metric2Val: 'Late 2026 Target',
        metric3Val: 'Hinjawadi Phase 2/3 Feeder E-Buses',
        metric4Val: 'PMRDA / Tata-Siemens'
      });
    });
  });
}

// 2b. Render PMPML Bus Corridors
function renderPMPMLCorridors() {
  PMPML_BUS_CORRIDORS.forEach(route => {
    const poly = L.polyline(route.coordinates, {
      color: route.color,
      weight: 3.5,
      dashArray: '5, 6',
      opacity: 0.85
    }).addTo(state.layers.pmpml);

    poly.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <span style="font-size:10px; font-weight:700; color:#fca5a5; text-transform:uppercase; letter-spacing:0.04em;">PMPML Bus Trunk</span>
        <h4 style="margin:2px 0 6px; font-size:13px; color:#fff; font-weight:700;">${route.name}</h4>
        <div style="font-size:11px; color:#e2e8f0;">Headway: Every ${route.frequencyMins} mins | Buses: ${route.busesInService}</div>
        <div style="font-size:10px; color:#cbd5e1; margin-top:4px;">${route.overlapStatus}</div>
      </div>
    `);

    poly.on('click', () => {
      updateInspector({
        type: 'PMPML BUS CORRIDOR',
        tagClass: 'tag-red',
        name: route.name,
        coords: 'Network Spine Corridor',
        desc: `Key arterial bus route. Overlap status: ${route.overlapStatus}`,
        metric1Val: `${route.dailyCommuters.toLocaleString()} pax/day`,
        metric2Val: `${route.busesInService} Buses (${route.frequencyMins} min frequency)`,
        metric3Val: route.overlapStatus.includes('Overlap') ? 'High Overlap (Convert to Feeders)' : 'Keep as Radial Trunk',
        metric4Val: `~${(route.busesInService * 65).toLocaleString()} L Diesel/day`
      });
    });
  });
}

// 2c. Render 500m Catchment Buffers
function renderCatchmentBuffers() {
  const allStations = [
    ...PUNE_METRO_LINES.purple.stations,
    ...PUNE_METRO_LINES.aqua.stations,
    ...PUNE_METRO_LINES.line3.stations
  ];

  allStations.forEach(stn => {
    L.circle(stn.coords, {
      radius: 500, // 500 meters
      fillColor: '#8b5cf6',
      fillOpacity: 0.08,
      color: '#8b5cf6',
      weight: 1,
      dashArray: '3, 4',
      interactive: false
    }).addTo(state.layers.catchment);
  });
}

// 2d. Render Transit Deserts (Gaps)
function renderTransitGapPolygons() {
  TRANSIT_DESERT_ZONES.forEach(gap => {
    const polygon = L.polygon(gap.polygon, {
      fillColor: '#f43f5e',
      fillOpacity: 0.22,
      color: '#f43f5e',
      weight: 2,
      dashArray: '5, 5'
    }).addTo(state.layers.gaps);

    polygon.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <span style="font-size:10px; font-weight:700; color:#fca5a5; text-transform:uppercase; letter-spacing:0.04em;">Transit Desert (Gap Zone)</span>
        <h4 style="margin:2px 0 6px; font-size:14px; color:#fff; font-weight:700;">${gap.name}</h4>
        <div style="font-size:11px; color:#e2e8f0;">Pop: ${gap.population.toLocaleString()} | Nearest Metro: ${gap.nearestMetroDistKm} km</div>
        <div style="font-size:11px; color:#cbd5e1; margin-top:3px;">Avg Bus Wait: <b>${gap.avgBusWaitMins} mins</b></div>
      </div>
    `);

    polygon.on('click', () => {
      updateInspector({
        type: 'TRANSIT DESERT',
        tagClass: 'tag-red',
        name: gap.name,
        coords: 'High Density Settlement',
        desc: `Severe public transport vacuum. Population is over ${gap.population.toLocaleString()} with average ${gap.avgBusWaitMins} min bus wait time and ${gap.nearestMetroDistKm} km distance to nearest metro.`,
        metric1Val: `${gap.population.toLocaleString()} citizens`,
        metric2Val: `${gap.nearestMetroName} (${gap.nearestMetroDistKm} km)`,
        metric3Val: `${gap.congestionIndex} / 10 (Severe)`,
        metric4Val: gap.recommendedFeeder
      });
    });
  });
}

// 2e. Render Multimodal Interchange Hubs
function renderMultimodalHubs() {
  MULTIMODAL_HUBS.forEach(hub => {
    const hubIcon = L.divIcon({
      className: 'custom-hub-icon',
      html: `
        <div style="background:#f59e0b; width:24px; height:24px; border-radius:50%; border:2px solid #fff; display:flex; align-items:center; justify-content:center; box-shadow:0 0 14px rgba(245,158,11,0.8); cursor:pointer;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker(hub.coords, { icon: hubIcon }).addTo(state.layers.hubs);

    marker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <span style="font-size:10px; font-weight:700; color:#fde68a; text-transform:uppercase; letter-spacing:0.04em;">Multimodal Interchange</span>
        <h4 style="margin:2px 0 6px; font-size:14px; color:#fff; font-weight:700;">${hub.name}</h4>
        <div style="font-size:11px; color:#e2e8f0;">Friction Score: <b>${hub.overallFrictionScore}/100</b></div>
        <div style="font-size:11px; color:#cbd5e1;">Walk to Feeder: ${hub.avgTransferWalkMeters}m | Wait: ${hub.avgTransferWaitMins} min</div>
      </div>
    `);

    marker.on('click', () => {
      updateInspector({
        type: 'INTERCHANGE HUB',
        tagClass: 'tag-orange',
        name: hub.name,
        coords: `${hub.coords[0].toFixed(4)}, ${hub.coords[1].toFixed(4)}`,
        desc: hub.keyIssue,
        metric1Val: `${hub.dailyTransfers.toLocaleString()} commuters`,
        metric2Val: `${hub.overallFrictionScore} / 100 (${hub.overallFrictionScore > 70 ? 'High Friction' : 'Moderate'})`,
        metric3Val: `${hub.avgTransferWalkMeters} meters (~${Math.round(hub.avgTransferWalkMeters / 75)} mins walk)`,
        metric4Val: hub.modes.join(', ')
      });
    });
  });
}

// 2f. Render Proposed Feeder Routes
function renderProposedFeeders() {
  PROPOSED_FEEDER_ROUTES.forEach(feeder => {
    const poly = L.polyline(feeder.coords, {
      color: feeder.color,
      weight: 5,
      opacity: 0.95,
      lineCap: 'round'
    }).addTo(state.layers.feeders);

    poly.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <span style="font-size:10px; font-weight:700; color:#6ee7b7; text-transform:uppercase; letter-spacing:0.04em;">Simulated Feeder Route</span>
        <h4 style="margin:2px 0 6px; font-size:13px; color:#fff; font-weight:700;">${feeder.name}</h4>
        <div style="font-size:11px; color:#e2e8f0;">Length: ${feeder.lengthKm} km | Headway: ${feeder.frequencyMins} mins</div>
        <div style="font-size:11px; color:#34d399; margin-top:2px;">Pop Gain: +${feeder.popCoverageGain.toLocaleString()}</div>
      </div>
    `);

    poly.on('click', () => {
      document.getElementById('sim-feeder-select').value = feeder.id;
      handleFeederSimulationChange(feeder.id);
    });
  });
}

/* =========================================================================
   3. SPATIAL INSPECTOR & SIMULATOR LOGIC
   ========================================================================= */
function initInspectorAndSimulator() {
  const simSelect = document.getElementById('sim-feeder-select');
  if (simSelect) {
    simSelect.addEventListener('change', (e) => {
      handleFeederSimulationChange(e.target.value);
    });
  }

  document.getElementById('btn-apply-sim')?.addEventListener('click', () => {
    const val = document.getElementById('sim-feeder-select')?.value || 'F1';
    handleFeederSimulationChange(val, true);
  });
}

function handleFeederSimulationChange(feederId, zoomTo = false) {
  const feeder = PROPOSED_FEEDER_ROUTES.find(f => f.id === feederId);
  if (!feeder) return;

  state.feederSimulationSelection = feederId;

  // Update simulator numbers
  const popGainEl = document.getElementById('sim-pop-gain');
  const timeGainEl = document.getElementById('sim-time-gain');
  if (popGainEl) popGainEl.innerText = `+${feeder.popCoverageGain.toLocaleString()}`;
  if (timeGainEl) timeGainEl.innerText = `-${feeder.avgWaitReductionMins} mins`;

  // Update Inspector HUD
  updateInspector({
    type: 'SIMULATED FEEDER',
    tagClass: 'tag-green',
    name: feeder.name,
    coords: `Feeder Corridor (${feeder.lengthKm} km)`,
    desc: `Optimized electric feeder loop connecting underserved zone to ${feeder.connectsToMetro}. Replaces long informal auto-rickshaw rides with reliable 9m EV buses.`,
    metric1Val: `+${feeder.popCoverageGain.toLocaleString()} residents`,
    metric2Val: `${feeder.fleetAllocated} E-Buses (${feeder.frequencyMins} min frequency)`,
    metric3Val: `Saved ${feeder.avgWaitReductionMins} mins per trip`,
    metric4Val: `${feeder.estDailyRiders.toLocaleString()} passengers/day`
  });

  if (zoomTo && state.map) {
    const polyline = L.polyline(feeder.coords);
    state.map.fitBounds(polyline.getBounds().pad(0.3), { animate: true });
  }
}

function updateInspector(data) {
  const typeEl = document.getElementById('insp-type');
  const nameEl = document.getElementById('insp-name');
  const coordsEl = document.getElementById('insp-coords');
  const descEl = document.getElementById('insp-desc');
  const m1El = document.getElementById('insp-metric-1');
  const m2El = document.getElementById('insp-metric-2');
  const m3El = document.getElementById('insp-metric-3');
  const m4El = document.getElementById('insp-metric-4');

  if (typeEl) {
    typeEl.innerText = data.type;
    typeEl.className = `inspector-tag ${data.tagClass || 'tag-purple'}`;
  }
  if (nameEl) nameEl.innerText = data.name;
  if (coordsEl) coordsEl.innerText = data.coords;
  if (descEl) descEl.innerText = data.desc;

  if (m1El) m1El.innerText = data.metric1Val;
  if (m2El) m2El.innerText = data.metric2Val;
  if (m3El) m3El.innerText = data.metric3Val;
  if (m4El) m4El.innerText = data.metric4Val;
}

/* =========================================================================
   4. VIEW 2: TRANSFER DELAYS & MULTI-CRITERIA HUB OBSERVATORY
   ========================================================================= */
function initHubDelaysView() {
  populateMCATable();
}

function populateMCATable() {
  const tbody = document.getElementById('mca-table-body');
  if (!tbody) return;

  tbody.innerHTML = MULTIMODAL_HUBS.map(hub => {
    const frictionColor = hub.overallFrictionScore > 75 ? '#f43f5e' : hub.overallFrictionScore > 45 ? '#f59e0b' : '#10b981';
    return `
      <tr>
        <td>
          <div style="font-weight:700; color:#fff; font-size:0.86rem;">${hub.name}</div>
          <span style="font-size:10px; color:var(--text-muted);">${hub.signageScore} Signage Rating</span>
        </td>
        <td>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">
            ${hub.modes.map(m => `<span style="font-size:10px; padding:2px 6px; background:rgba(255,255,255,0.06); border-radius:4px; border:1px solid var(--border-subtle);">${m}</span>`).join('')}
          </div>
        </td>
        <td style="font-family:var(--font-mono); font-weight:600;">${hub.avgTransferWalkMeters} m</td>
        <td style="font-family:var(--font-mono); font-weight:600; color:${hub.avgTransferWaitMins > 12 ? '#fb7185' : '#38bdf8'};">${hub.avgTransferWaitMins} min</td>
        <td style="font-family:var(--font-mono);">${hub.dailyTransfers.toLocaleString()}</td>
        <td>
          <div class="friction-meter">
            <span style="font-weight:700; font-family:var(--font-mono); color:${frictionColor}; width:24px;">${hub.overallFrictionScore}</span>
            <div class="friction-bar-bg">
              <div class="friction-bar-fill" style="width:${hub.overallFrictionScore}%; background:${frictionColor};"></div>
            </div>
          </div>
        </td>
        <td style="font-size:11px; color:#cbd5e1; max-width:260px; line-height:1.4;">${hub.keyIssue}</td>
      </tr>
    `;
  }).join('');
}

function renderHubDelayCharts() {
  // Chart 1: Hub Delays Bar
  const ctx1 = document.getElementById('chartHubDelays')?.getContext('2d');
  if (ctx1 && !state.charts.hubDelays) {
    state.charts.hubDelays = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: MULTIMODAL_HUBS.map(h => h.name.split(' ')[0]),
        datasets: [
          {
            label: 'Avg Transfer Wait (mins)',
            data: MULTIMODAL_HUBS.map(h => h.avgTransferWaitMins),
            backgroundColor: 'rgba(244, 63, 94, 0.75)',
            borderColor: '#f43f5e',
            borderWidth: 1,
            borderRadius: 6
          },
          {
            label: 'Walk to Feeder Stop (decameters / 10m)',
            data: MULTIMODAL_HUBS.map(h => Math.round(h.avgTransferWalkMeters / 10)),
            backgroundColor: 'rgba(139, 92, 246, 0.75)',
            borderColor: '#8b5cf6',
            borderWidth: 1,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#cbd5e1', font: { family: 'Outfit', size: 11 } } }
        },
        scales: {
          x: { ticks: { color: '#cbd5e1', font: { family: 'Outfit' } }, grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { ticks: { color: '#94a3b8', font: { family: 'Outfit' } }, grid: { color: 'rgba(255,255,255,0.06)' } }
        }
      }
    });
  }

  // Chart 2: Hourly Delay Curves
  const ctx2 = document.getElementById('chartHourlyDelays')?.getContext('2d');
  if (ctx2 && !state.charts.hourlyDelays) {
    const hours = ['7 AM', '8 AM', '9 AM', '10 AM', '12 PM', '2 PM', '5 PM', '6 PM', '7 PM', '8 PM', '10 PM'];
    state.charts.hourlyDelays = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [
          {
            label: 'Swargate Hub (min wait)',
            data: [8, 18, 24, 16, 10, 9, 21, 26, 22, 14, 8],
            borderColor: '#f43f5e',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Pune Station (min wait)',
            data: [10, 19, 23, 17, 12, 11, 22, 25, 20, 15, 9],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Civil Court (min wait)',
            data: [3, 6, 8, 5, 4, 4, 7, 9, 8, 5, 3],
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.12)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#cbd5e1', font: { family: 'Outfit', size: 11 } } }
        },
        scales: {
          x: { ticks: { color: '#cbd5e1', font: { family: 'Outfit' } }, grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { ticks: { color: '#94a3b8', font: { family: 'Outfit' } }, grid: { color: 'rgba(255,255,255,0.06)' } }
        }
      }
    });
  }
}

/* =========================================================================
   5. VIEW 3: COMMUTER SURVEY ANALYTICS & LIVE INTAKE FORM
   ========================================================================= */
function initSurveyView() {
  renderSurveyResponsesFeed();

  const form = document.getElementById('survey-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const newResponse = {
        id: `R-${Math.floor(1000 + Math.random() * 9000)}`,
        age: document.getElementById('surv-age').value,
        occupation: document.getElementById('surv-occ').value,
        residence: document.getElementById('surv-origin').value,
        workplace: document.getElementById('surv-dest').value,
        primaryMode: document.getElementById('surv-mode').value,
        usesMetro: "Active Respondent",
        reason: "Survey form entry via Mind the Gap web application.",
        metroTransferChallenge: document.getElementById('surv-barrier').value,
        recommendedFeederLocation: `Feeder from ${document.getElementById('surv-origin').value} to ${document.getElementById('surv-station').value} Metro`
      };

      // Add to state
      state.surveyData.totalResponses += 1;
      state.surveyData.responsesList.unshift(newResponse);

      // Save to localStorage
      saveSurveyResponses();

      // Update UI
      document.getElementById('survey-count-badge').innerText = `${state.surveyData.totalResponses} responses`;
      renderSurveyResponsesFeed();

      // Reset Form
      form.reset();
      alert("Thank you! Your survey contribution has been integrated into Group 38's live spatial model.");
    });
  }
}

function renderSurveyResponsesFeed() {
  const container = document.getElementById('survey-response-stream');
  if (!container) return;

  container.innerHTML = state.surveyData.responsesList.map(r => `
    <div class="response-bubble">
      <div class="response-header">
        <span style="font-weight:700; color:#f1f5f9; display:flex; align-items:center; gap:5px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
          ${r.occupation} (${r.age}) • ${r.residence} ➔ ${r.workplace}
        </span>
        <span class="inspector-tag tag-purple" style="font-size:9px;">${r.primaryMode}</span>
      </div>
      <p class="response-quote">"${r.metroTransferChallenge}"</p>
      <div style="font-size:10.5px; color:#34d399; font-weight:500;">
        <b>Suggested Feeder:</b> ${r.recommendedFeederLocation}
      </div>
    </div>
  `).join('');
}

function renderSurveyCharts() {
  // Chart 3: Modal Split
  const ctx3 = document.getElementById('chartModalSplit')?.getContext('2d');
  if (ctx3 && !state.charts.modalSplit) {
    state.charts.modalSplit = new Chart(ctx3, {
      type: 'doughnut',
      data: {
        labels: ['Private Two-Wheeler / Car', 'PMPML Bus', 'Pune Metro', 'Auto / Shared Cab'],
        datasets: [{
          data: [
            state.surveyData.modalSplit.privateVehicles,
            state.surveyData.modalSplit.pmpmlBus,
            state.surveyData.modalSplit.puneMetro,
            state.surveyData.modalSplit.autoShared
          ],
          backgroundColor: ['#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4'],
          borderWidth: 2,
          borderColor: '#0f172a'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#cbd5e1', font: { family: 'Outfit', size: 11.5 } } }
        }
      }
    });
  }

  // Chart 4: Survey Barriers
  const ctx4 = document.getElementById('chartSurveyBarriers')?.getContext('2d');
  if (ctx4 && !state.charts.surveyBarriers) {
    const barriers = state.surveyData.reasonsAvoidPublicTransport;
    state.charts.surveyBarriers = new Chart(ctx4, {
      type: 'bar',
      indexAxis: 'y',
      data: {
        labels: barriers.map(b => b.reason),
        datasets: [{
          label: '% Commuters Reporting Issue',
          data: barriers.map(b => b.percentage),
          backgroundColor: 'rgba(6, 182, 212, 0.75)',
          borderColor: '#06b6d4',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { color: '#94a3b8', font: { family: 'Outfit' } }, grid: { color: 'rgba(255,255,255,0.06)' }, max: 100 },
          y: { ticks: { color: '#f1f5f9', font: { family: 'Outfit', size: 11.5 } }, grid: { display: false } }
        }
      }
    });
  }
}

function saveSurveyResponses() {
  try {
    localStorage.setItem('mindthegap_pune_surveys', JSON.stringify(state.surveyData.responsesList));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
  }
}

function loadStoredSurveyResponses() {
  try {
    const stored = localStorage.getItem('mindthegap_pune_surveys');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.surveyData.responsesList = parsed;
        state.surveyData.totalResponses = 412 + (parsed.length - 3);
        const badge = document.getElementById('survey-count-badge');
        if (badge) badge.innerText = `${state.surveyData.totalResponses} responses`;
      }
    }
  } catch (e) {
    console.warn('LocalStorage load error:', e);
  }
}

/* =========================================================================
   6. VIEW 4: POLICY ROADMAP & ECONOMIC CALCULATOR
   ========================================================================= */
function initPolicyCalculator() {
  const sliderFleet = document.getElementById('slider-fleet-size');
  const sliderKm = document.getElementById('slider-daily-km');
  const sliderSaved = document.getElementById('slider-buses-saved');
  const sliderDiscount = document.getElementById('slider-fare-discount');

  function recalculateEconomics() {
    const fleet = parseInt(sliderFleet.value);
    const dailyKm = parseInt(sliderKm.value);
    const saved = parseInt(sliderSaved.value);
    const discount = parseInt(sliderDiscount.value);

    document.getElementById('val-fleet-size').innerText = `${fleet} Buses`;
    document.getElementById('val-daily-km').innerText = `${dailyKm} km/day`;
    document.getElementById('val-buses-saved').innerText = `${saved} Buses`;
    document.getElementById('val-fare-discount').innerText = `${discount}% Off Combined`;

    // Mathematical Sizing & Economics
    const dieselSavingsCr = ((saved * dailyKm * 300 * 0.42 * 94) / 10000000).toFixed(1);
    document.getElementById('calc-fuel-savings').innerText = `₹ ${dieselSavingsCr} Cr`;

    const dailyFeederRiders = Math.round(fleet * 1900 * (1 + (discount * 0.008)));
    document.getElementById('calc-feeder-riders').innerText = dailyFeederRiders.toLocaleString();

    const co2TonsDay = ((dailyFeederRiders * 6.5 * 0.142) / 1000).toFixed(1);
    document.getElementById('calc-co2-saved').innerText = `${co2TonsDay} Tons/day`;

    const treeOffset = Math.round(parseFloat(co2TonsDay) * 45);
    document.getElementById('calc-tree-offset').innerText = `${treeOffset} Trees/yr`;
  }

  [sliderFleet, sliderKm, sliderSaved, sliderDiscount].forEach(s => {
    if (s) s.addEventListener('input', recalculateEconomics);
  });

  recalculateEconomics();
  renderGovernanceMatrix();
}

function renderGovernanceMatrix() {
  const container = document.getElementById('gov-matrix-container');
  if (!container) return;

  container.innerHTML = POLICY_ECONOMIC_DATA.governanceMatrix.map(item => `
    <div class="gov-card">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <h4 class="gov-title">${item.agency}</h4>
        <span class="gov-pill">Stakeholder</span>
      </div>
      <p style="font-size:11.5px; color:#cbd5e1; line-height:1.45;"><b>Primary Role:</b> ${item.role}</p>
      <div style="font-size:11.5px; color:#fb7185; line-height:1.45;"><b>Current Silo:</b> ${item.currentSilo}</div>
      <div style="font-size:11.5px; color:#34d399; line-height:1.45; border-top:1px solid var(--border-subtle); padding-top:6px;">
        <b>Multi-Modal Action:</b> ${item.integrationRequirement}
      </div>
    </div>
  `).join('');
}

/* =========================================================================
   7. VIEW 5: GIS DATA HUB & EXPORT PIPELINE
   ========================================================================= */
function initGISDataHub() {
  const dropzone = document.getElementById('gis-dropzone');
  const fileInput = document.getElementById('gis-file-input');
  const browseBtn = document.getElementById('btn-browse-file');
  const codePreview = document.getElementById('gis-code-preview');

  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', () => fileInput.click());
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        processUploadedGeoJSON(e.target.files[0]);
      }
    });
  }

  if (dropzone) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = '#8b5cf6';
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'rgba(139, 92, 246, 0.45)';
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'rgba(139, 92, 246, 0.45)';
      if (e.dataTransfer.files.length > 0) {
        processUploadedGeoJSON(e.dataTransfer.files[0]);
      }
    });
  }

  // Update Live Code Preview with initial GeoJSON sample
  if (codePreview) {
    const sampleGeoJSON = generatePuneMetroGeoJSON();
    codePreview.innerText = JSON.stringify(sampleGeoJSON, null, 2);
  }

  // Export Buttons
  document.getElementById('btn-export-metro')?.addEventListener('click', () => {
    downloadGeoJSON(generatePuneMetroGeoJSON(), 'pune_metro_network.geojson');
  });

  document.getElementById('btn-export-feeders')?.addEventListener('click', () => {
    downloadGeoJSON(generateFeedersGeoJSON(), 'pune_proposed_feeders.geojson');
  });

  document.getElementById('btn-export-gaps')?.addEventListener('click', () => {
    downloadGeoJSON(generateGapZonesGeoJSON(), 'pune_transit_gap_deserts.geojson');
  });
}

function processUploadedGeoJSON(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const geojson = JSON.parse(event.target.result);
      
      // Add layer to map
      state.layers.customUploaded.clearLayers();
      const customLayer = L.geoJSON(geojson, {
        style: {
          color: '#ec4899',
          weight: 4,
          fillColor: '#ec4899',
          fillOpacity: 0.3
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {};
          layer.bindPopup(`
            <div style="font-family:sans-serif; padding:4px;">
              <span style="font-size:10px; font-weight:700; color:#f472b6; letter-spacing:0.04em;">CUSTOM GIS LAYER</span>
              <h4 style="margin:2px 0; color:#fff; font-weight:700;">${props.name || 'Imported Feature'}</h4>
              <div style="font-size:11px; color:#cbd5e1;">${props.description || 'Imported from QGIS/ArcGIS GeoJSON'}</div>
            </div>
          `);
        }
      }).addTo(state.layers.customUploaded);

      // Fit Bounds
      state.map.fitBounds(customLayer.getBounds());

      // Update Preview
      document.getElementById('gis-code-preview').innerText = JSON.stringify(geojson, null, 2);
      document.getElementById('gis-feature-count').innerText = `${geojson.features?.length || 1} Custom GIS Features`;

      // Switch to GIS Map View
      document.getElementById('tab-gis').click();
      alert(`Success! Imported "${file.name}" with ${geojson.features?.length || 1} spatial features into the live map.`);

    } catch (err) {
      alert(`Error parsing GeoJSON file: ${err.message}`);
    }
  };
  reader.readAsText(file);
}

// 7a. GeoJSON Generators
function generatePuneMetroGeoJSON() {
  const features = [];

  // Purple Line
  features.push({
    type: "Feature",
    properties: {
      lineId: "purple",
      lineName: "Pune Metro Purple Line (Line 1)",
      corridor: "PCMC to Swargate",
      status: "Operational",
      dailyRidership: 92000
    },
    geometry: {
      type: "LineString",
      coordinates: PUNE_METRO_LINES.purple.stations.map(s => [s.coords[1], s.coords[0]])
    }
  });

  // Aqua Line
  features.push({
    type: "Feature",
    properties: {
      lineId: "aqua",
      lineName: "Pune Metro Aqua Line (Line 2)",
      corridor: "Vanaz to Ramwadi",
      status: "Operational",
      dailyRidership: 108000
    },
    geometry: {
      type: "LineString",
      coordinates: PUNE_METRO_LINES.aqua.stations.map(s => [s.coords[1], s.coords[0]])
    }
  });

  // Stations
  [...PUNE_METRO_LINES.purple.stations, ...PUNE_METRO_LINES.aqua.stations].forEach(stn => {
    features.push({
      type: "Feature",
      properties: {
        stationId: stn.id,
        name: stn.name,
        type: stn.type,
        interchanges: stn.interchange
      },
      geometry: {
        type: "Point",
        coordinates: [stn.coords[1], stn.coords[0]]
      }
    });
  });

  return {
    type: "FeatureCollection",
    crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    features
  };
}

function generateFeedersGeoJSON() {
  const features = PROPOSED_FEEDER_ROUTES.map(feeder => ({
    type: "Feature",
    properties: {
      feederId: feeder.id,
      name: feeder.name,
      lengthKm: feeder.lengthKm,
      frequencyMins: feeder.frequencyMins,
      busesAllocated: feeder.fleetAllocated,
      targetGapZone: feeder.targetGapId,
      connectingMetroStation: feeder.connectsToMetro,
      popCoverageGain: feeder.popCoverageGain
    },
    geometry: {
      type: "LineString",
      coordinates: feeder.coords.map(c => [c[1], c[0]])
    }
  }));

  return {
    type: "FeatureCollection",
    features
  };
}

function generateGapZonesGeoJSON() {
  const features = TRANSIT_DESERT_ZONES.map(gap => ({
    type: "Feature",
    properties: {
      gapId: gap.id,
      name: gap.name,
      population: gap.population,
      distanceToNearestMetroKm: gap.nearestMetroDistKm,
      nearestMetroStation: gap.nearestMetroName,
      avgWaitMins: gap.avgBusWaitMins,
      congestionIndex: gap.congestionIndex
    },
    geometry: {
      type: "Polygon",
      coordinates: [gap.polygon.map(c => [c[1], c[0]])]
    }
  }));

  return {
    type: "FeatureCollection",
    features
  };
}

function downloadGeoJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

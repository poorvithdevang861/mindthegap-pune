/**
 * Mind the Gap — Pune Transit Analytics & GIS Dashboard
 * Core application logic & spatial layer orchestrator
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
import { PUNE_FULL_WARDS } from './data/pune_full_wards.js';

// Global App State
const state = {
  activeView: 'gis-explorer',
  map: null,
  activeTileLayer: 'osm',
  layers: {
    purple: null,
    aqua: null,
    line3: null,
    pmpml: null,
    catchment: null,
    gaps: null,
    hubs: null,
    feeders: null,
    pmcWards: null,
    pcmcWards: null,
    selectedWardLayer: null,
    selectedWardGeojson: null,
    selectedWardData: null,
    activeFeederHighlight: null,
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
  initWardModalEvents();
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

  // Create custom z-index panes so polygons never obscure metro lines or block station clicks
  state.map.createPane('wardsPane');
  state.map.getPane('wardsPane').style.zIndex = 350;

  state.map.createPane('buffersPane');
  state.map.getPane('buffersPane').style.zIndex = 380;

  state.map.createPane('corridorsPane');
  state.map.getPane('corridorsPane').style.zIndex = 450;

  state.map.createPane('metroPane');
  state.map.getPane('metroPane').style.zIndex = 520;

  state.map.createPane('stationsPane');
  state.map.getPane('stationsPane').style.zIndex = 650;

  // High-Resolution Basemap Tile Providers (Accurate India Maps without watermarks)
  const basemapLayers = {
    street: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '&copy; Esri &mdash; Survey of India & OpenStreetMap'
    }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '&copy; Esri, Maxar, Earthstar Geographics'
    }),
    osm: L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors, Humanitarian OpenStreetMap Team'
    }),
    dark: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '&copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
    })
  };

  // Add default India Street Map
  basemapLayers.street.addTo(state.map);
  state.basemapLayers = basemapLayers;
  state.currentBasemapKey = 'street';

  // Layer Groups
  state.layers.purple = L.layerGroup().addTo(state.map);
  state.layers.aqua = L.layerGroup().addTo(state.map);
  state.layers.line3 = L.layerGroup().addTo(state.map);
  state.layers.pmpml = L.layerGroup().addTo(state.map);
  state.layers.catchment = L.layerGroup().addTo(state.map);
  state.layers.gaps = L.layerGroup().addTo(state.map);
  state.layers.hubs = L.layerGroup().addTo(state.map);
  state.layers.feeders = L.layerGroup().addTo(state.map);
  state.layers.pmcWards = L.layerGroup().addTo(state.map);
  state.layers.pcmcWards = L.layerGroup().addTo(state.map);
  state.layers.activeFeederHighlight = L.layerGroup().addTo(state.map);
  state.layers.customUploaded = L.layerGroup().addTo(state.map);

  // Render All Spatial Layers in proper geographic hierarchy
  renderPuneFullWards();
  renderCatchmentBuffers();
  renderTransitGapPolygons();
  renderPMPMLCorridors();
  renderMetroLines();
  renderProposedFeeders();
  renderMultimodalHubs();

  // Floating controls on Map
  document.getElementById('btn-focus-pune')?.addEventListener('click', () => {
    state.map.setView(PUNE_CENTER, DEFAULT_ZOOM, { animate: true });
  });

  // Fit Entire Metropolitan Region (PMC + PCMC bounds)
  document.getElementById('btn-fit-region')?.addEventListener('click', () => {
    // Fits both PCMC (North) and PMC (South) bounding box accurately
    const puneRegionBounds = L.latLngBounds(
      [18.38556, 73.71040],
      [18.72107, 74.01831]
    );
    state.map.fitBounds(puneRegionBounds, { padding: [20, 20], animate: true });
  });

  // Basemap Selector Switcher
  const basemapSelect = document.getElementById('select-basemap');
  if (basemapSelect) {
    basemapSelect.addEventListener('change', (e) => {
      const selectedKey = e.target.value;
      if (state.basemapLayers[selectedKey] && state.currentBasemapKey !== selectedKey) {
        state.map.removeLayer(state.basemapLayers[state.currentBasemapKey]);
        state.basemapLayers[selectedKey].addTo(state.map);
        state.currentBasemapKey = selectedKey;
      }
    });
  }

  document.getElementById('btn-reset-map')?.addEventListener('click', () => {
    state.map.setView(PUNE_CENTER, DEFAULT_ZOOM);
    ['purple', 'aqua', 'line3', 'pmpml', 'catchment', 'gaps', 'hubs', 'feeders', 'pmc-wards', 'pcmc-wards'].forEach(layerKey => {
      const toggle = document.getElementById(`toggle-${layerKey}`);
      if (toggle) {
        toggle.checked = true;
        const key = layerKey === 'pmc-wards' ? 'pmcWards' : layerKey === 'pcmc-wards' ? 'pcmcWards' : layerKey;
        if (state.layers[key] && !state.map.hasLayer(state.layers[key])) {
          state.map.addLayer(state.layers[key]);
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
  setupLayerToggle('toggle-pmc-wards', 'pmcWards');
  setupLayerToggle('toggle-pcmc-wards', 'pcmcWards');
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
    pane: 'metroPane',
    color: '#8b5cf6',
    weight: 5,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(state.layers.purple);

  // Purple Glow layer
  L.polyline(purpleCoords, {
    pane: 'metroPane',
    color: '#a78bfa',
    weight: 11,
    opacity: 0.25,
    lineCap: 'round'
  }).addTo(state.layers.purple);

  purple.stations.forEach(stn => {
    const isInterchange = stn.type === 'interchange' || stn.type === 'major_hub';
    const marker = L.circleMarker(stn.coords, {
      pane: 'stationsPane',
      radius: isInterchange ? 8 : 5,
      fillColor: '#8b5cf6',
      color: '#ffffff',
      weight: isInterchange ? 2.5 : 1.5,
      opacity: 1,
      fillOpacity: 0.95
    }).addTo(state.layers.purple);

    marker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <span style="font-size:10px; font-weight:700; color:#6d28d9; text-transform:uppercase; letter-spacing:0.04em;">Line 1 • Purple Line</span>
        <h4 style="margin:2px 0 6px; font-size:14px; color:#0f172a; font-weight:700;">${stn.name}</h4>
        <div style="font-size:11px; color:#64748b;"><b>Interchange:</b> ${stn.interchange.join(', ') || 'Local Access'}</div>
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
    pane: 'metroPane',
    color: '#06b6d4',
    weight: 5,
    opacity: 0.95,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(state.layers.aqua);

  L.polyline(aquaCoords, {
    pane: 'metroPane',
    color: '#22d3ee',
    weight: 11,
    opacity: 0.25,
    lineCap: 'round'
  }).addTo(state.layers.aqua);

  aqua.stations.forEach(stn => {
    const isInterchange = stn.type === 'interchange' || stn.type === 'major_hub';
    const marker = L.circleMarker(stn.coords, {
      pane: 'stationsPane',
      radius: isInterchange ? 8 : 5,
      fillColor: '#06b6d4',
      color: '#ffffff',
      weight: isInterchange ? 2.5 : 1.5,
      opacity: 1,
      fillOpacity: 0.95
    }).addTo(state.layers.aqua);

    marker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <span style="font-size:10px; font-weight:700; color:#0e7490; text-transform:uppercase; letter-spacing:0.04em;">Line 2 • Aqua Line</span>
        <h4 style="margin:2px 0 6px; font-size:14px; color:#0f172a; font-weight:700;">${stn.name}</h4>
        <div style="font-size:11px; color:#64748b;"><b>Interchange:</b> ${stn.interchange.join(', ') || 'Local Access'}</div>
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
    pane: 'metroPane',
    color: '#f59e0b',
    weight: 4.5,
    dashArray: '8, 8',
    opacity: 0.95,
    lineCap: 'round'
  }).addTo(state.layers.line3);

  line3.stations.forEach(stn => {
    const isInterchange = stn.type === 'interchange' || stn.type === 'major_hub';
    const marker = L.circleMarker(stn.coords, {
      pane: 'stationsPane',
      radius: isInterchange ? 7 : 4.5,
      fillColor: '#f59e0b',
      color: '#ffffff',
      weight: 1.5,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(state.layers.line3);

    marker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <span style="font-size:10px; font-weight:700; color:#b45309; text-transform:uppercase; letter-spacing:0.04em;">Line 3 (Under Const.)</span>
        <h4 style="margin:2px 0 6px; font-size:14px; color:#0f172a; font-weight:700;">${stn.name}</h4>
        <div style="font-size:11px; color:#64748b;">PMRDA Hinjawadi IT Corridor</div>
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
      pane: 'corridorsPane',
      color: route.color,
      weight: 3.5,
      dashArray: '5, 6',
      opacity: 0.85
    }).addTo(state.layers.pmpml);

    poly.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <span style="font-size:10px; font-weight:700; color:#be123c; text-transform:uppercase; letter-spacing:0.04em;">PMPML Bus Trunk</span>
        <h4 style="margin:2px 0 6px; font-size:13px; color:#0f172a; font-weight:700;">${route.name}</h4>
        <div style="font-size:11px; color:#475569;">Headway: Every ${route.frequencyMins} mins | Buses: ${route.busesInService}</div>
        <div style="font-size:10px; color:#64748b; margin-top:4px;">${route.overlapStatus}</div>
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
      pane: 'buffersPane',
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
      pane: 'buffersPane',
      fillColor: '#f43f5e',
      fillOpacity: 0.22,
      color: '#f43f5e',
      weight: 2,
      dashArray: '5, 5'
    }).addTo(state.layers.gaps);

    polygon.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <span style="font-size:10px; font-weight:700; color:#be123c; text-transform:uppercase; letter-spacing:0.04em;">Transit Desert (Gap Zone)</span>
        <h4 style="margin:2px 0 6px; font-size:14px; color:#0f172a; font-weight:700;">${gap.name}</h4>
        <div style="font-size:11px; color:#475569;">Pop: ${gap.population.toLocaleString()} | Nearest Metro: ${gap.nearestMetroDistKm} km</div>
        <div style="font-size:11px; color:#64748b; margin-top:3px;">Avg Bus Wait: <b>${gap.avgBusWaitMins} mins</b></div>
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

      // Auto-activate corresponding feeder route simulation if mapped
      const matchingFeeder = PROPOSED_FEEDER_ROUTES.find(f => f.targetGapId === gap.id);
      if (matchingFeeder) {
        handleFeederSimulationChange(matchingFeeder.id, false);
      }
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

    const marker = L.marker(hub.coords, { icon: hubIcon, pane: 'stationsPane' }).addTo(state.layers.hubs);

    marker.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <span style="font-size:10px; font-weight:700; color:#b45309; text-transform:uppercase; letter-spacing:0.04em;">Multimodal Interchange</span>
        <h4 style="margin:2px 0 6px; font-size:14px; color:#0f172a; font-weight:700;">${hub.name}</h4>
        <div style="font-size:11px; color:#475569;">Friction Score: <b>${hub.overallFrictionScore}/100</b></div>
        <div style="font-size:11px; color:#64748b;">Walk to Feeder: ${hub.avgTransferWalkMeters}m | Wait: ${hub.avgTransferWaitMins} min</div>
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
      pane: 'metroPane',
      color: feeder.color,
      weight: 5,
      opacity: 0.85,
      lineCap: 'round'
    }).addTo(state.layers.feeders);

    poly.bindPopup(`
      <div style="font-family:sans-serif; padding:4px;">
        <span style="font-size:10px; font-weight:700; color:#047857; text-transform:uppercase; letter-spacing:0.04em;">Proposed feeder</span>
        <h4 style="margin:2px 0 6px; font-size:13px; color:#0f172a; font-weight:700;">${feeder.name}</h4>
        <div style="font-size:11px; color:#475569;">Length: ${feeder.lengthKm} km | Headway: ${feeder.frequencyMins} mins</div>
        <div style="font-size:11px; color:#059669; margin-top:2px;">Pop Gain: +${feeder.popCoverageGain.toLocaleString()}</div>
      </div>
    `);

    poly.on('click', () => {
      updateInspector({
        type: 'Proposed feeder',
        tagClass: 'tag-green',
        name: feeder.name,
        coords: `Line ${feeder.id} · ${feeder.lengthKm} km`,
        desc: feeder.description,
        metric1Val: `+${feeder.popCoverageGain.toLocaleString()} citizens`,
        metric2Val: `-${feeder.avgWaitReductionMins} mins wait`,
        metric3Val: `${feeder.fleetAllocated || feeder.fleetRecommended} buses`,
        metric4Val: feeder.connectsToMetro || feeder.metroStation
      });
    });
  });
}

// Spatial Proximity and Distance Helpers for Ward Demographic Analytics
function getHaversineDistKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestMetroStation(lat, lon) {
  let nearest = null;
  let minD = Infinity;
  const lines = [
    { key: 'purple', name: 'Purple Line (L1)', color: '#8b5cf6', stations: PUNE_METRO_LINES.purple.stations },
    { key: 'aqua', name: 'Aqua Line (L2)', color: '#06b6d4', stations: PUNE_METRO_LINES.aqua.stations },
    { key: 'line3', name: 'Line 3 (IT Metro)', color: '#f59e0b', stations: PUNE_METRO_LINES.line3.stations }
  ];

  lines.forEach(l => {
    l.stations.forEach(stn => {
      const d = getHaversineDistKm(lat, lon, stn.coords[0], stn.coords[1]);
      if (d < minD) {
        minD = d;
        nearest = {
          name: stn.name,
          line: l.name,
          lineColor: l.color,
          distKm: d.toFixed(2),
          coords: stn.coords
        };
      }
    });
  });
  return nearest;
}

function findNearestFeeder(lat, lon) {
  let nearest = null;
  let minD = Infinity;
  PROPOSED_FEEDER_ROUTES.forEach(f => {
    if (f.pathCoordinates && f.pathCoordinates.length > 0) {
      const startCoord = f.pathCoordinates[0];
      const d = getHaversineDistKm(lat, lon, startCoord[0], startCoord[1]);
      if (d < minD) {
        minD = d;
        nearest = f;
      }
    }
  });
  return nearest;
}

function findTransitGapMatch(lat, lon) {
  let matchedGap = null;
  let minD = Infinity;
  TRANSIT_DESERT_ZONES.forEach(gap => {
    if (gap.polygon && gap.polygon.length > 0) {
      let sumLat = 0, sumLon = 0;
      gap.polygon.forEach(pt => { sumLat += pt[0]; sumLon += pt[1]; });
      const cLat = sumLat / gap.polygon.length;
      const cLon = sumLon / gap.polygon.length;
      const d = getHaversineDistKm(lat, lon, cLat, cLon);
      if (d < 3.5 && d < minD) {
        minD = d;
        matchedGap = gap;
      }
    }
  });
  return matchedGap;
}

// Clear currently active highlighted ward polygon
function clearWardHighlight(closeDrawer = true) {
  if (state.selectedWardLayer) {
    if (state.selectedWardGeojson) {
      state.selectedWardGeojson.resetStyle(state.selectedWardLayer);
    }
    state.selectedWardLayer = null;
    state.selectedWardGeojson = null;
    state.selectedWardData = null;
  }
  if (closeDrawer) {
    hideWardTableDrawer();
  }
}

// Highlight the clicked ward polygon and pop up its attribute table
function selectAndHighlightWard(layer, feature, isPMC, geojsonLayer) {
  // 1. Reset previously highlighted ward polygon
  clearWardHighlight(false);

  // 2. Register current selection
  state.selectedWardLayer = layer;
  state.selectedWardGeojson = geojsonLayer;

  // 3. Highlight the clicked ward along its exact boundary perimeter
  layer.setStyle({
    color: isPMC ? '#1e40af' : '#065f46',
    weight: 3.5,
    opacity: 1,
    fillColor: isPMC ? '#3b82f6' : '#10b981',
    fillOpacity: 0.45
  });
  layer.bringToFront();

  // 4. Calculate detailed spatial & demographic metrics
  const p = feature.properties || {};
  const corpName = isPMC ? 'Pune Municipal Corporation' : 'Pimpri Chinchwad Municipal Corporation';
  const corpShort = isPMC ? 'PMC' : 'PCMC';
  const wardNo = isPMC 
    ? (p.Polygons_WardNumber || p.PMC_wards_2025_xlsx___PMC_41_Wards_2025_Population_csv_Ward_No || '')
    : (p.Pimpri_Chinchwad_sourcewa_1 || p.PCMC_ward_wisepop_data_v3_csv_Ward_No || '');
  
  const wardName = isPMC 
    ? (p.PMC_wards_2025_xlsx___PMC_41_Wards_2025_Population_csv_Ward_Name || `Ward ${wardNo}`)
    : (p.PCMC_ward_wisepop_data_v3_csv_PCMC_Ward___Area_Name || p.Pimpri_Chinchwad_ward_lgd_n || `Ward ${wardNo}`);
  
  const pop2026 = Math.round(isPMC ? (p.Polygons_Pop_2026 || 0) : (p.Pimpri_Chinchwad_Pop_2026 || 0));
  const pop2025 = Math.round(isPMC ? (p.PMC_wards_2025_xlsx___PMC_41_Wards_2025_Population_csv_Population || 0) : (p.PCMC_ward_wisepop_data_v3_csv_Population || 0));
  const rawArea = isPMC ? p.Shape_Area : (p.Pimpri_Chinchwad_st_area_sh || p.Shape_Area);
  const areaKm2 = rawArea ? (rawArea / 1000000).toFixed(2) : 'N/A';
  const numArea = parseFloat(areaKm2);
  const density = (numArea > 0 && pop2026 > 0) ? Math.round(pop2026 / numArea) : (numArea > 0 && pop2025 > 0 ? Math.round(pop2025 / numArea) : null);
  const growthRate = (pop2025 > 0 && pop2026 > 0) ? (((pop2026 - pop2025) / pop2025) * 100).toFixed(1) : null;
  const vuln = p.Pimpri_Chinchwad_AMJ_Vulner || (isPMC ? 'Urban Heat Island Corridor' : 'Medium');

  const bounds = layer.getBounds();
  const center = bounds.getCenter();
  const nearestMetro = findNearestMetroStation(center.lat, center.lng);
  const nearestFeeder = findNearestFeeder(center.lat, center.lng);
  const matchedGap = findTransitGapMatch(center.lat, center.lng);

  const wardData = {
    feature,
    layer,
    isPMC,
    corpName,
    corpShort,
    wardNo,
    wardName,
    pop2026,
    pop2025,
    growthRate,
    areaKm2,
    rawArea: Math.round(rawArea || 0),
    density,
    vuln,
    center,
    nearestMetro,
    nearestFeeder,
    matchedGap
  };

  state.selectedWardData = wardData;

  // 5. Open the floating Overview of the Ward table drawer
  showWardTableDrawer(wardData);
}

// Populate and display the Ward Attribute Table Drawer
function showWardTableDrawer(data) {
  if (!data) return;
  const drawer = document.getElementById('ward-table-modal');
  if (!drawer) return;

  drawer.style.display = 'flex';
  drawer.classList.remove('minimized');
  const body = document.getElementById('ward-drawer-body');
  if (body) body.style.display = 'flex';

  // Corporation Pill
  const corpPill = document.getElementById('ward-modal-corp');
  if (corpPill) {
    corpPill.textContent = data.corpShort;
    corpPill.className = `ward-corp-pill ${data.corpShort.toLowerCase()}`;
  }

  // Ward No Pill
  const noPill = document.getElementById('ward-modal-no');
  if (noPill) {
    noPill.textContent = data.wardNo ? `Ward #${data.wardNo}` : 'Ward Area';
  }

  // Density Pill
  const densityPill = document.getElementById('ward-modal-density-badge');
  if (densityPill) {
    if (data.density && data.density >= 22000) {
      densityPill.textContent = '🔥 High Density Cluster';
      densityPill.className = 'ward-density-pill high';
    } else if (data.density && data.density >= 14000) {
      densityPill.textContent = '⚡ Moderate Density';
      densityPill.className = 'ward-density-pill moderate';
    } else {
      densityPill.textContent = '🌱 Dispersed / Suburban';
      densityPill.className = 'ward-density-pill medium';
    }
  }

  // Ward Name & Subtitle
  const nameEl = document.getElementById('ward-modal-name');
  if (nameEl) nameEl.textContent = `Overview of ${data.wardName}`;

  const subEl = document.getElementById('ward-modal-subtitle');
  if (subEl) {
    subEl.textContent = `${data.corpName} · Ward #${data.wardNo || 'N/A'}`;
  }

  // Inject KPI Cards
  const kpisGrid = document.getElementById('ward-kpis-grid');
  if (kpisGrid) {
    kpisGrid.innerHTML = `
      <div class="ward-kpi-card">
        <span class="kpi-label">2026 Projected Pop</span>
        <span class="kpi-val">${data.pop2026 > 0 ? data.pop2026.toLocaleString() : 'N/A'}</span>
        <span class="kpi-tag positive">
          ${data.growthRate ? `+${data.growthRate}% vs 2025` : 'ArcGIS GIS Proj.'}
        </span>
      </div>
      <div class="ward-kpi-card">
        <span class="kpi-label">2025 Baseline Pop</span>
        <span class="kpi-val">${data.pop2025 > 0 ? data.pop2025.toLocaleString() : 'N/A'}</span>
        <span class="kpi-tag neutral">Census baseline</span>
      </div>
      <div class="ward-kpi-card">
        <span class="kpi-label">Gross Land Area</span>
        <span class="kpi-val">${data.areaKm2} km²</span>
        <span class="kpi-tag neutral">${data.rawArea ? data.rawArea.toLocaleString() + ' m²' : 'Polygon'}</span>
      </div>
      <div class="ward-kpi-card">
        <span class="kpi-label">Population Density</span>
        <span class="kpi-val">${data.density ? data.density.toLocaleString() : 'N/A'}</span>
        <span class="kpi-tag neutral">persons / km²</span>
      </div>
    `;
  }

  // Inject Overview Attribute Table
  const tbody = document.getElementById('ward-attr-tbody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td class="attr-name">Ward Name &amp; Locality</td>
        <td class="attr-val highlight">${data.wardName}</td>
      </tr>
      <tr>
        <td class="attr-name">Official Ward Identifier</td>
        <td class="attr-val">Ward #${data.wardNo || 'N/A'}</td>
      </tr>
      <tr>
        <td class="attr-name">Municipal Corporation</td>
        <td class="attr-val">${data.corpName} (${data.corpShort})</td>
      </tr>
      <tr>
        <td class="attr-name">2026 Projected Population</td>
        <td class="attr-val highlight">${data.pop2026 > 0 ? data.pop2026.toLocaleString() + ' residents' : 'Calculated by Model'}</td>
      </tr>
      <tr>
        <td class="attr-name">2025 Baseline Population</td>
        <td class="attr-val">${data.pop2025 > 0 ? data.pop2025.toLocaleString() + ' residents' : 'Baseline unrecorded'}</td>
      </tr>
      <tr>
        <td class="attr-name">Projected Population Growth</td>
        <td class="attr-val">${data.growthRate ? '+' + data.growthRate + '% annual growth' : 'Census baseline register'}</td>
      </tr>
      <tr>
        <td class="attr-name">Gross Surface Area</td>
        <td class="attr-val">${data.areaKm2} km² (${data.rawArea.toLocaleString()} m²)</td>
      </tr>
      <tr>
        <td class="attr-name">Urban Population Density</td>
        <td class="attr-val">${data.density ? data.density.toLocaleString() + ' persons / km²' : 'N/A'}</td>
      </tr>
      <tr>
        <td class="attr-name">Summer Heat Vulnerability</td>
        <td class="attr-val">${data.vuln}</td>
      </tr>
      <tr>
        <td class="attr-name">Nearest Rapid Transit Station</td>
        <td class="attr-val">${data.nearestMetro ? data.nearestMetro.name + ' (' + data.nearestMetro.line + ') &mdash; ~' + data.nearestMetro.distKm + ' km' : 'None within 5 km'}</td>
      </tr>
      <tr>
        <td class="attr-name">Spatial Data Boundary</td>
        <td class="attr-val">IMP Group 38 ArcGIS Pro Spatial Polygon Model</td>
      </tr>
    `;
  }
}

function hideWardTableDrawer() {
  const drawer = document.getElementById('ward-table-modal');
  if (drawer) {
    drawer.style.display = 'none';
    drawer.classList.remove('minimized');
  }
}

// Bind event listeners for Ward Attribute Table Drawer
function initWardModalEvents() {
  // Zoom Button
  document.getElementById('btn-ward-zoom')?.addEventListener('click', () => {
    if (state.selectedWardData && state.selectedWardData.layer) {
      state.map.fitBounds(state.selectedWardData.layer.getBounds(), {
        padding: [60, 60],
        maxZoom: 15,
        animate: true
      });
    }
  });

  // Minimize / Expand Toggle
  document.getElementById('btn-ward-minimize')?.addEventListener('click', () => {
    const drawer = document.getElementById('ward-table-modal');
    if (drawer) {
      drawer.classList.toggle('minimized');
      const isMin = drawer.classList.contains('minimized');
      const minIcon = document.getElementById('ward-min-icon');
      if (minIcon) {
        minIcon.innerHTML = isMin 
          ? '<polyline points="18 15 12 9 6 15"/>'
          : '<polyline points="6 9 12 15 18 9"/>';
      }
    }
  });

  // Close Button
  document.getElementById('btn-ward-close')?.addEventListener('click', () => {
    clearWardHighlight(true);
  });

  // Export GeoJSON Button
  document.getElementById('btn-ward-export-geojson')?.addEventListener('click', () => {
    if (state.selectedWardData && state.selectedWardData.feature) {
      const blob = new Blob([JSON.stringify(state.selectedWardData.feature, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pune_${state.selectedWardData.corpShort.toLowerCase()}_ward_${state.selectedWardData.wardNo || 'boundary'}.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  });
}

// 2g. Render PMC & PCMC Wards (Imported from ArcGIS Pro IMP Project)
function renderPuneFullWards() {
  if (!PUNE_FULL_WARDS || !PUNE_FULL_WARDS.features) return;

  // Split into PMC (South/Central Pune - 41 Wards) and PCMC (North Pune - 32 Wards)
  const pmcFeatures = [];
  const pcmcFeatures = [];

  PUNE_FULL_WARDS.features.forEach(feat => {
    const p = feat.properties || {};
    const isPMC = Boolean(p.PMC_wards_2025_xlsx___PMC_41_Wards_2025_Population_csv_Ward_Name || p.Polygons_WardNumber);
    if (isPMC) {
      pmcFeatures.push(feat);
    } else {
      pcmcFeatures.push(feat);
    }
  });

  function setupWardLayer(features, isPMC, targetLayerGroup) {
    const geojsonLayer = L.geoJSON({ type: 'FeatureCollection', features }, {
      pane: 'wardsPane',
      style: () => ({
        color: isPMC ? '#1d4ed8' : '#047857',
        weight: 1.5,
        opacity: 0.85,
        fillColor: isPMC ? '#3b82f6' : '#10b981',
        fillOpacity: 0.16
      }),
      onEachFeature: (feature, layer) => {
        const p = feature.properties || {};
        const corpName = isPMC ? 'PMC (Pune Corporation)' : 'PCMC (Pimpri Chinchwad)';
        const wardNo = isPMC 
          ? (p.Polygons_WardNumber || p.PMC_wards_2025_xlsx___PMC_41_Wards_2025_Population_csv_Ward_No || '')
          : (p.Pimpri_Chinchwad_sourcewa_1 || p.PCMC_ward_wisepop_data_v3_csv_Ward_No || '');
        
        const wardName = isPMC 
          ? (p.PMC_wards_2025_xlsx___PMC_41_Wards_2025_Population_csv_Ward_Name || `Ward ${wardNo}`)
          : (p.PCMC_ward_wisepop_data_v3_csv_PCMC_Ward___Area_Name || p.Pimpri_Chinchwad_ward_lgd_n || `Ward ${wardNo}`);
        
        const pop2026 = Math.round(isPMC ? (p.Polygons_Pop_2026 || 0) : (p.Pimpri_Chinchwad_Pop_2026 || 0));

        // Tooltip on Hover
        layer.bindTooltip(`
          <div style="font-family:sans-serif; font-size:11px; padding:2px 4px;">
            <b style="color:${isPMC ? '#1d4ed8' : '#047857'};">[${isPMC ? 'PMC' : 'PCMC'}] Ward ${wardNo}:</b> ${wardName}<br/>
            <span style="color:#64748b;">Pop (2026): <b>${pop2026 > 0 ? pop2026.toLocaleString() : 'N/A'}</b></span><br/>
            <span style="color:#0891b2; font-size:10px; font-weight:600;">Click to highlight ward &amp; open table</span>
          </div>
        `, { sticky: true, opacity: 0.95, pane: 'stationsPane' });

        // Hover style transitions (only when not actively selected)
        layer.on('mouseover', () => {
          if (state.selectedWardLayer !== layer) {
            layer.setStyle({
              weight: 2.5,
              fillOpacity: 0.32
            });
          }
        });

        layer.on('mouseout', () => {
          if (state.selectedWardLayer !== layer) {
            geojsonLayer.resetStyle(layer);
          }
        });

        // Click to highlight exact ward polygon & open attribute table drawer
        layer.on('click', (e) => {
          if (e && e.originalEvent) {
            L.DomEvent.stopPropagation(e);
          }
          selectAndHighlightWard(layer, feature, isPMC, geojsonLayer);
        });
      }
    }).addTo(targetLayerGroup);
  }

  // Clear ward selection when clicking anywhere else on the map
  state.map.on('click', () => {
    clearWardHighlight(true);
  });

  setupWardLayer(pmcFeatures, true, state.layers.pmcWards);
  setupWardLayer(pcmcFeatures, false, state.layers.pcmcWards);
}

/* =========================================================================
   3. SPATIAL INSPECTOR & SIMULATOR LOGIC
   ========================================================================= */
function initInspectorAndSimulator() {
  const simSelect = document.getElementById('sim-feeder-select');
  if (simSelect) {
    simSelect.addEventListener('change', (e) => {
      handleFeederSimulationChange(e.target.value, true);
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

  // Make sure Feeders layer toggle is checked and layer is on the map
  const feederToggle = document.getElementById('toggle-feeders');
  if (feederToggle && !feederToggle.checked) {
    feederToggle.checked = true;
    if (state.map && !state.map.hasLayer(state.layers.feeders)) {
      state.map.addLayer(state.layers.feeders);
    }
  }

  // Update dropdown value if out of sync
  const simSelect = document.getElementById('sim-feeder-select');
  if (simSelect && simSelect.value !== feederId) {
    simSelect.value = feederId;
  }

  // Update simulator numbers
  const popGainEl = document.getElementById('sim-pop-gain');
  const timeGainEl = document.getElementById('sim-time-gain');
  if (popGainEl) popGainEl.innerText = `+${feeder.popCoverageGain.toLocaleString()}`;
  if (timeGainEl) timeGainEl.innerText = `-${feeder.avgWaitReductionMins} mins`;

  // Pulse simulation panel to provide clear visual feedback
  const panel = document.getElementById('feeder-sim-panel');
  if (panel) {
    panel.classList.remove('feeder-sim-pulse');
    void panel.offsetWidth; // force CSS reflow
    panel.classList.add('feeder-sim-pulse');
    setTimeout(() => panel.classList.remove('feeder-sim-pulse'), 1600);
  }

  // Update Inspector HUD
  updateInspector({
    type: 'Proposed feeder',
    tagClass: 'tag-green',
    name: feeder.name,
    coords: `Feeder Corridor (${feeder.lengthKm} km)`,
    desc: `Short electric bus loop linking an underserved area to ${feeder.connectsToMetro}. Replaces long auto rides with a reliable EV feeder.`,
    metric1Val: `+${feeder.popCoverageGain.toLocaleString()} residents`,
    metric2Val: `${feeder.fleetAllocated} E-Buses (${feeder.frequencyMins} min frequency)`,
    metric3Val: `Saved ${feeder.avgWaitReductionMins} mins per trip`,
    metric4Val: `${feeder.estDailyRiders.toLocaleString()} passengers/day`
  });

  // Highlight route prominently on the interactive map
  if (state.layers.activeFeederHighlight) {
    state.layers.activeFeederHighlight.clearLayers();

    // 1. Highlight connected Transit Desert Gap zone if associated
    if (feeder.targetGapId) {
      const targetGap = TRANSIT_DESERT_ZONES.find(g => g.id === feeder.targetGapId);
      if (targetGap) {
        L.polygon(targetGap.polygon, {
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.22,
          weight: 2.5,
          dashArray: '5, 5',
          className: 'feeder-gap-glow'
        }).addTo(state.layers.activeFeederHighlight);
      }
    }

    // 2. Outer Glowing Halo Polyline
    L.polyline(feeder.coords, {
      color: '#10b981',
      weight: 16,
      opacity: 0.65,
      className: 'feeder-glow-line',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(state.layers.activeFeederHighlight);

    // 3. High-Contrast Core Polyline
    const activeCorePoly = L.polyline(feeder.coords, {
      color: '#059669',
      weight: 6,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(state.layers.activeFeederHighlight);

    // 4. Directional Animated Dashed Flow
    L.polyline(feeder.coords, {
      color: '#ffffff',
      weight: 2.5,
      opacity: 0.95,
      dashArray: '8, 12',
      className: 'feeder-animated-flow',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(state.layers.activeFeederHighlight);

    // 5. Origin Terminus Marker (Bus Icon)
    const originCoords = feeder.coords[0];
    const originPin = L.divIcon({
      className: 'feeder-pin-wrapper',
      html: `
        <div class="feeder-pin feeder-pin-origin" title="Feeder Origin Node">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
          </svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker(originCoords, { icon: originPin }).addTo(state.layers.activeFeederHighlight);

    // 6. Metro Connection Marker (Metro Hub Icon)
    const destCoords = feeder.coords[feeder.coords.length - 1];
    const metroPin = L.divIcon({
      className: 'feeder-pin-wrapper',
      html: `
        <div class="feeder-pin feeder-pin-metro" title="Connecting Metro: ${feeder.connectsToMetro}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="3" width="16" height="16" rx="2"/><line x1="4" y1="11" x2="20" y2="11"/><line x1="9" y1="15" x2="10" y2="15"/><line x1="14" y1="15" x2="15" y2="15"/>
          </svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker(destCoords, { icon: metroPin }).addTo(state.layers.activeFeederHighlight);

    // 7. Interactive Rich Popup
    const popupHtml = `
      <div class="feeder-highlight-popup-content">
        <div class="feeder-popup-header">
          <span class="feeder-popup-pill">⚡ SIMULATED FEEDER</span>
          <span class="feeder-popup-mode">${feeder.busType}</span>
        </div>
        <h4 class="feeder-popup-title">${feeder.name}</h4>
        <div class="feeder-popup-route-nodes">
          <div class="node-item"><span class="node-dot origin"></span> <span><b>Neighborhood Origin:</b> Starting Zone</span></div>
          <div class="node-item"><span class="node-dot metro"></span> <span><b>Metro Station:</b> ${feeder.connectsToMetro}</span></div>
        </div>
        <div class="feeder-popup-stats-grid">
          <div class="stat-box">
            <div class="stat-label">Pop Reach</div>
            <div class="stat-value gain">+${feeder.popCoverageGain.toLocaleString()}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Wait Saved</div>
            <div class="stat-value time">-${feeder.avgWaitReductionMins}m</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Fleet</div>
            <div class="stat-value fleet">${feeder.fleetAllocated} e-buses</div>
          </div>
        </div>
      </div>
    `;

    activeCorePoly.bindPopup(popupHtml, {
      className: 'feeder-active-popup',
      maxWidth: 320,
      autoPan: false
    });

    if (zoomTo && state.map) {
      const bounds = activeCorePoly.getBounds().pad(0.35);
      state.map.flyToBounds(bounds, {
        duration: 1.1,
        easeLinearity: 0.25
      });
      setTimeout(() => {
        activeCorePoly.openPopup();
      }, 700);
    }
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
          <div style="font-weight:700; color:#0f172a; font-size:0.86rem;">${hub.name}</div>
          <span style="font-size:10px; color:var(--text-muted);">${hub.signageScore} Signage Rating</span>
        </td>
        <td>
          <div style="display:flex; flex-wrap:wrap; gap:4px;">
            ${hub.modes.map(m => `<span style="font-size:10px; padding:2px 6px; background:var(--bg-subtle); border-radius:4px; border:1px solid var(--border-subtle); color:var(--text-secondary);">${m}</span>`).join('')}
          </div>
        </td>
        <td style="font-family:var(--font-mono); font-weight:600;">${hub.avgTransferWalkMeters} m</td>
        <td style="font-family:var(--font-mono); font-weight:600; color:${hub.avgTransferWaitMins > 12 ? '#e11d48' : '#0891b2'};">${hub.avgTransferWaitMins} min</td>
        <td style="font-family:var(--font-mono);">${hub.dailyTransfers.toLocaleString()}</td>
        <td>
          <div class="friction-meter">
            <span style="font-weight:700; font-family:var(--font-mono); color:${frictionColor}; width:24px;">${hub.overallFrictionScore}</span>
            <div class="friction-bar-bg">
              <div class="friction-bar-fill" style="width:${hub.overallFrictionScore}%; background:${frictionColor};"></div>
            </div>
          </div>
        </td>
        <td style="font-size:11px; color:#64748b; max-width:260px; line-height:1.4;">${hub.keyIssue}</td>
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
          legend: { labels: { color: '#64748b', font: { family: 'Outfit', size: 11 } } }
        },
        scales: {
          x: { ticks: { color: '#64748b', font: { family: 'Outfit' } }, grid: { color: 'rgba(15,23,42,0.06)' } },
          y: { ticks: { color: '#64748b', font: { family: 'Outfit' } }, grid: { color: 'rgba(15,23,42,0.06)' } }
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
          legend: { labels: { color: '#64748b', font: { family: 'Outfit', size: 11 } } }
        },
        scales: {
          x: { ticks: { color: '#64748b', font: { family: 'Outfit' } }, grid: { color: 'rgba(15,23,42,0.06)' } },
          y: { ticks: { color: '#64748b', font: { family: 'Outfit' } }, grid: { color: 'rgba(15,23,42,0.06)' } }
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
      alert("Thank you — your response has been added to the live commute model.");
    });
  }
}

function renderSurveyResponsesFeed() {
  const container = document.getElementById('survey-response-stream');
  if (!container) return;

  container.innerHTML = state.surveyData.responsesList.map(r => `
    <div class="response-bubble">
      <div class="response-header">
        <span style="font-weight:700; color:#0f172a; display:flex; align-items:center; gap:5px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
          ${r.occupation} (${r.age}) • ${r.residence} ➔ ${r.workplace}
        </span>
        <span class="inspector-tag tag-purple" style="font-size:9px;">${r.primaryMode}</span>
      </div>
      <p class="response-quote">"${r.metroTransferChallenge}"</p>
      <div style="font-size:10.5px; color:#059669; font-weight:500;">
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
          legend: { position: 'right', labels: { color: '#64748b', font: { family: 'Outfit', size: 11.5 } } }
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
          x: { ticks: { color: '#64748b', font: { family: 'Outfit' } }, grid: { color: 'rgba(15,23,42,0.06)' }, max: 100 },
          y: { ticks: { color: '#0f172a', font: { family: 'Outfit', size: 11.5 } }, grid: { display: false } }
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
      <p style="font-size:11.5px; color:#64748b; line-height:1.45;"><b>Primary Role:</b> ${item.role}</p>
      <div style="font-size:11.5px; color:#e11d48; line-height:1.45;"><b>Current Silo:</b> ${item.currentSilo}</div>
      <div style="font-size:11.5px; color:#059669; line-height:1.45; border-top:1px solid var(--border-subtle); padding-top:6px;">
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
              <span style="font-size:10px; font-weight:700; color:#db2777; letter-spacing:0.04em;">CUSTOM GIS LAYER</span>
              <h4 style="margin:2px 0; color:#0f172a; font-weight:700;">${props.name || 'Imported Feature'}</h4>
              <div style="font-size:11px; color:#64748b;">${props.description || 'Imported from QGIS/ArcGIS GeoJSON'}</div>
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

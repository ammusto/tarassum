import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { loadData, searchPlaces } from '../data/loader.js';

const TILE_LAYERS = {
  terrain: {
    name: 'Terrain',
    url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain_background/{z}/{x}/{y}{r}.png',
    attribution: '&copy; Stamen Design &copy; OpenStreetMap',
  },
  terrainGray: {
    name: 'Terrain (Gray)',
    url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain_background/{z}/{x}/{y}{r}.png',
    attribution: '&copy; Stamen Design &copy; OpenStreetMap',
    className: 'grayscale-tiles',
  },
  landmass: { name: 'Landmass Only', url: null, landGeoJson: '/land10m.geojson' },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
};

// Canvas circleMarker styling per type. Every color is unique so users can
// distinguish types by color alone (no shape cues anymore).
const TYPE_STYLES = {
  metropoles:  { color: '#000000', size: 5 },
  capitals:    { color: '#222222', size: 5 },
  towns:       { color: '#444444', size: 4 },
  waystations: { color: '#666666', size: 3 },
  villages:    { color: '#888888', size: 3 },
  xroads:      { color: '#999999', size: 3 },
  waters:      { color: '#6BA3BE', size: 3 },
  sites:       { color: '#cccccc', size: 3 },
};

// Display names for legend
const TYPE_LABELS = {
  metropoles: 'Metropoles',
  capitals: 'Capitals',
  towns: 'Towns',
  waystations: 'Waystations',
  villages: 'Villages',
  xroads: 'Crossroads',
  waters: 'Waters',
  sites: 'Sites',
};

const ROUTE_COLOR = '#5c3a1e';
const NO_REGION_COLOR = '#000000';

// Zoom at which each place type's marker first appears
const ZOOM_TIERS = {
  metropoles: 0,
  capitals: 0,
  towns: 6,
  villages: 7,
  waystations: 7,
  xroads: 10,
  sites: 7,
};

// Zoom at which each place type's label first appears
const LABEL_TIERS = {
  metropoles: 0,
  capitals: 5.5,
  towns: 8.5,
  villages: 9,
  waystations: 8.5,
  sites: 9,
};

export default function ViewMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const landLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routesLayerRef = useRef(null);
  const watersLayerRef = useRef(null);
  const bordersLayerRef = useRef(null);
  const placeMarkersRef = useRef([]); // [{ marker, place }]
  const routeLinesRef = useRef([]); // [{ polyline, startRegion, endRegion }]
  const [data, setData] = useState(null);
  const [activeLayer, setActiveLayer] = useState('terrain');
  const [showWaters, setShowWaters] = useState(false);
  const [showBorders, setShowBorders] = useState(false);
  const [showRegions, setShowRegions] = useState(false);
  const [showRegionsKey, setShowRegionsKey] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const isMobileDefault = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
  const [mapKeyOpen, setMapKeyOpen] = useState(!isMobileDefault);
  const [zoomLevelsOpen, setZoomLevelsOpen] = useState(!isMobileDefault);
  const [mapSettingsOpen, setMapSettingsOpen] = useState(!isMobileDefault);
  const [mapReady, setMapReady] = useState(false);

  // Search Map state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchTypeFilter, setSearchTypeFilter] = useState('all');
  const [searchRegionFilter, setSearchRegionFilter] = useState('all');
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);

  const SEARCH_TYPE_OPTIONS = ['all', 'metropoles', 'capitals', 'towns', 'waystations', 'villages', 'xroads', 'waters', 'sites'];

  const regionKeys = useMemo(
    () => (data ? Object.keys(data.regions).sort() : []),
    [data]
  );

  // Search effect
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 1) { setSearchResults([]); return; }
    let res = searchPlaces(searchQuery, 50).filter(p => p.type !== 'regions' && p.type !== 'quarters');
    if (searchTypeFilter !== 'all') res = res.filter(p => p.type === searchTypeFilter);
    if (searchRegionFilter !== 'all') res = res.filter(p => p.region === searchRegionFilter);
    setSearchResults(res.slice(0, 30));
    setShowSearchDropdown(true);
  }, [searchQuery, searchTypeFilter, searchRegionFilter]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target) &&
          searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchSelect = (place) => {
    const map = mapInstanceRef.current;
    if (map && place.lat != null && place.lng != null) {
      map.flyTo([place.lat, place.lng], 9, { duration: 0.8 });
    }
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  useEffect(() => {
    loadData().then(d => setData(d));
  }, []);

  // Initialize map via ref callback
  const initMap = useCallback((node) => {
    mapRef.current = node;
    if (!node || mapInstanceRef.current) return;
    const map = L.map(node, {
      center: [33, 44],
      zoom: 5,
      minZoom: 3,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 120,
      zoomControl: false,
      attributionControl: true,
      renderer: L.canvas({ padding: 0.5 }),
      preferCanvas: true,
    });
    L.control.scale({ position: 'bottomright', metric: true, imperial: false, maxWidth: 200 }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);
    watersLayerRef.current = L.layerGroup();
    setMapReady(true);
  }, []);

  // Tile layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;
    if (tileLayerRef.current) { map.removeLayer(tileLayerRef.current); tileLayerRef.current = null; }
    if (landLayerRef.current) { map.removeLayer(landLayerRef.current); landLayerRef.current = null; }

    const cfg = TILE_LAYERS[activeLayer];
    if (cfg && cfg.url) {
      tileLayerRef.current = L.tileLayer(cfg.url, {
        attribution: cfg.attribution, maxZoom: 18, className: cfg.className || '',
        keepBuffer: 10,
      }).addTo(map);
      map.getContainer().style.backgroundColor = '#ffffff';
    } else if (cfg && cfg.landGeoJson) {
      map.getContainer().style.backgroundColor = '#f0f0f0';
      fetch(cfg.landGeoJson)
        .then(r => r.json())
        .then(geojson => {
          landLayerRef.current = L.geoJSON(geojson, {
            style: { color: '#aaaaaa', weight: 0.8, fillColor: '#ffffff', fillOpacity: 1 },
            interactive: false,
          }).addTo(map);
          landLayerRef.current.bringToBack();
        }).catch(() => { });
    }
  }, [activeLayer, mapReady]);

  // Toggle waters layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    const watersLayer = watersLayerRef.current;
    if (!map || !watersLayer) return;
    if (showWaters) {
      if (!map.hasLayer(watersLayer)) map.addLayer(watersLayer);
    } else {
      if (map.hasLayer(watersLayer)) map.removeLayer(watersLayer);
    }
  }, [showWaters]);

  // Modern borders layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;
    if (bordersLayerRef.current) {
      map.removeLayer(bordersLayerRef.current);
      bordersLayerRef.current = null;
    }
    if (!showBorders) return;
    let cancelled = false;
    fetch('/borders.geojson')
      .then(r => r.json())
      .then(geojson => {
        if (cancelled || !showBorders) return;
        bordersLayerRef.current = L.geoJSON(geojson, {
          style: { color: '#999', weight: 1, fillOpacity: 0, dashArray: '4 3' },
          interactive: false,
        }).addTo(map);
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [showBorders, mapReady]);

  // Build markers once data is ready, update visibility on zoom
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !data || !mapReady) return;

    const markersLayer = markersLayerRef.current;
    const routesLayer = routesLayerRef.current;
    const watersLayer = watersLayerRef.current;
    markersLayer.clearLayers();
    routesLayer.clearLayers();
    watersLayer.clearLayers();

    const placeById = {};
    for (const p of data.places) placeById[p.id] = p;

    // Build routes once with default color; showRegions effect recolors them in place
    const routeLines = [];
    for (const route of data.routes) {
      const latLngs = route.coords.map(c => [c[1], c[0]]);
      const startPlace = placeById[route.s];
      const endPlace = placeById[route.e];
      const polyline = L.polyline(latLngs, {
        color: ROUTE_COLOR,
        weight: 1.5,
        opacity: 0.5,
      }).addTo(routesLayer);
      routeLines.push({
        polyline,
        startRegion: startPlace?.region || null,
        endRegion: endPlace?.region || null,
      });
    }
    routeLinesRef.current = routeLines;

    // Create all markers grouped by tier. Build with default (non-region) colors;
    // showRegions effect will swap icons in place without rebuilding.
    const markersByTier = {};
    const labelsByTier = {};
    const placeMarkers = [];
    for (const place of data.places) {
      if (place.type === 'regions' || place.type === 'quarters' || place.type === 'xroads') continue;

      const displayName = place.ijmes_cornuData || place.ijmes_name || place.name;
      const regionMeta = place.region ? data.regions?.[place.region] : null;
      const regionLine = regionMeta
        ? `<br><span style="color:#666">Region: ${regionMeta.display}</span>`
        : '';
      const typeLabel = place.type ? place.type.charAt(0).toUpperCase() + place.type.slice(1) : '';
      const popupContent = `<div style="font-size:14px"><strong>${displayName}</strong>${place.nameAr ? `<br><span dir="rtl" style="font-size:18px;font-family:'Noto Naskh Arabic',serif;line-height:1.6">${place.nameAr}</span>` : ''}<br><span style="color:#666">Type: ${typeLabel}</span>${regionLine}</div>`;

      const makeMarker = (color) => {
        const style = TYPE_STYLES[place.type] || { size: 4, color: '#555555' };
        const fillColor = color || style.color;
        return L.circleMarker([place.lat, place.lng], {
          radius: style.size,
          fillColor,
          color: fillColor,
          weight: 1,
          fillOpacity: 1,
          interactive: true,
        });
      };

      // Waters go to their own toggle layer
      if (place.type === 'waters') {
        const marker = makeMarker(null);
        marker.bindPopup(popupContent);
        marker.addTo(watersLayer);
        continue;
      }

      const minZoom = ZOOM_TIERS[place.type] ?? 7;
      if (!markersByTier[minZoom]) markersByTier[minZoom] = L.layerGroup();

      const marker = makeMarker(null);
      marker.bindPopup(popupContent);
      marker.addTo(markersByTier[minZoom]);
      placeMarkers.push({ marker, place });

      // Add label: use LABEL_TIERS zoom if defined, otherwise default to node zoom tier
      const labelZoom = LABEL_TIERS[place.type] ?? minZoom;
      if (!labelsByTier[labelZoom]) labelsByTier[labelZoom] = { group: L.layerGroup(), pending: [] };
      const fontSize = place.type === 'metropoles' ? 14 : 12;
      const estW = displayName.length * fontSize * 0.55 + 8;
      const estH = fontSize + 4;
      labelsByTier[labelZoom].pending.push({
        lat: place.lat, lng: place.lng, displayName, fontSize, estW, estH, popupContent,
      });
    }

    // Simple 4-position overlap check for labels
    const PAD = 4; // gap between node and label edge
    const placedRects = [];

    // For a given label size, return 4 iconAnchor options that place the label
    // fully above/below/right/left of the node point
    function getPositions(w, h) {
      return [
        [w / 2, h + PAD],   // top: label centered above node
        [w / 2, -PAD],      // bottom: label centered below node
        [-PAD, h / 2],      // right: label to the right of node
        [w + PAD, h / 2],   // left: label to the left of node
      ];
    }

    function getLabelRect(pt, anchor, w, h) {
      // iconAnchor means: this pixel in the div sits on the point
      // div top-left = pt - anchor
      return { x: pt.x - anchor[0], y: pt.y - anchor[1], w, h };
    }

    function calcOverlap(rect) {
      let total = 0;
      for (const p of placedRects) {
        const ox = Math.max(0, Math.min(rect.x + rect.w, p.x + p.w) - Math.max(rect.x, p.x));
        const oy = Math.max(0, Math.min(rect.y + rect.h, p.y + p.h) - Math.max(rect.y, p.y));
        total += ox * oy;
      }
      return total;
    }

    // Process tiers in order so earlier labels (metropoles) get priority
    const tierKeys = Object.keys(labelsByTier).map(Number).sort((a, b) => a - b);
    for (const key of tierKeys) {
      const tier = labelsByTier[key];
      for (const item of tier.pending) {
        const pt = map.latLngToContainerPoint([item.lat, item.lng]);
        const positions = getPositions(item.estW, item.estH);

        let bestAnchor = positions[0];
        let bestOverlap = Infinity;
        for (const anchor of positions) {
          const rect = getLabelRect(pt, anchor, item.estW, item.estH);
          const ov = calcOverlap(rect);
          if (ov < bestOverlap) {
            bestOverlap = ov;
            bestAnchor = anchor;
            if (ov === 0) break;
          }
        }

        placedRects.push(getLabelRect(pt, bestAnchor, item.estW, item.estH));

        const labelMarker = L.marker([item.lat, item.lng], {
          icon: L.divIcon({
            className: 'city-label city-label-clickable',
            html: `<span style="font-size:${item.fontSize}px;color:#222;background:rgba(255,255,255,0.75);padding:1px 4px;border-radius:3px;white-space:nowrap;cursor:pointer">${item.displayName}</span>`,
            iconAnchor: bestAnchor,
          }),
          interactive: true,
          zIndexOffset: 1000,
        });
        labelMarker.bindPopup(item.popupContent);
        labelMarker.addTo(tier.group);
      }
    }

    placeMarkersRef.current = placeMarkers;

    // Re-apply waters visibility
    if (showWaters && !map.hasLayer(watersLayer)) map.addLayer(watersLayer);

    const updateVisibility = () => {
      const zoom = map.getZoom();
      for (const [minZoom, group] of Object.entries(markersByTier)) {
        if (zoom >= Number(minZoom)) {
          if (!markersLayer.hasLayer(group)) markersLayer.addLayer(group);
        } else {
          if (markersLayer.hasLayer(group)) markersLayer.removeLayer(group);
        }
      }
      for (const [minZoom, tier] of Object.entries(labelsByTier)) {
        if (zoom >= Number(minZoom)) {
          if (!markersLayer.hasLayer(tier.group)) markersLayer.addLayer(tier.group);
        } else {
          if (markersLayer.hasLayer(tier.group)) markersLayer.removeLayer(tier.group);
        }
      }
    };

    updateVisibility();
    map.on('zoomend', updateVisibility);

    return () => {
      map.off('zoomend', updateVisibility);
    };
  }, [data, mapReady]);

  // Recolor markers + routes when showRegions toggles, without rebuilding
  useEffect(() => {
    if (!data || !mapReady) return;
    const regionColor = (regionId) =>
      (regionId && data.regions?.[regionId]?.color) || NO_REGION_COLOR;

    // Markers: canvas circleMarkers, just swap fill + stroke colors
    for (const { marker, place } of placeMarkersRef.current) {
      const override = showRegions ? regionColor(place.region) : null;
      const fillColor = override || TYPE_STYLES[place.type]?.color || '#555555';
      marker.setStyle({ fillColor, color: fillColor });
    }

    // Routes
    const newOpacity = showRegions ? 0.7 : 0.5;
    for (const { polyline, startRegion, endRegion } of routeLinesRef.current) {
      let color = ROUTE_COLOR;
      if (showRegions) {
        const sameRegion = startRegion && startRegion === endRegion;
        color = sameRegion ? regionColor(startRegion) : (startRegion ? regionColor(startRegion) : ROUTE_COLOR);
      }
      polyline.setStyle({ color, opacity: newOpacity });
    }
  }, [showRegions, data, mapReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fullscreen: Esc to exit, and invalidateSize after resize
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const id = requestAnimationFrame(() => map.invalidateSize());
    return () => cancelAnimationFrame(id);
  }, [fullscreen]);

  // Re-measure on container resize so the map fills its box even on first paint
  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapRef.current;
    if (!map || !container || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(container);
    return () => ro.disconnect();
  }, [mapReady]);

  // Legend types to display (in order)
  const LEGEND_TYPES = ['metropoles', 'capitals', 'towns', 'waystations', 'villages', 'xroads', 'waters', 'sites'];

  return (
    <div className={fullscreen ? 'view-map-container view-map-fullscreen' : 'view-map-container'}>
      <div ref={initMap} className="view-map" />
      {/* Fullscreen toggle - top left */}
      <button
        onClick={() => setFullscreen(v => !v)}
        className="absolute top-2 left-2 z-[1001] bg-white rounded shadow border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer"
        title={fullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
      >
        {fullscreen ? 'Exit Full Screen' : 'Full Screen'}
      </button>
      {/* Search Map - collapsible panel below fullscreen button */}
      {data && (
        <div className="absolute top-10 left-2 z-[1001] bg-white rounded shadow border border-gray-200 p-2" style={{ width: searchOpen ? '19rem' : 'auto' }}>
          <button
            onClick={() => setSearchOpen(v => !v)}
            className="flex items-center justify-between w-full text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <span>Search Map</span>
            <span className="text-gray-400 ml-3">{searchOpen ? '▾' : '▸'}</span>
          </button>
          {searchOpen && (
            <div className="mt-1.5">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchResults.length) setShowSearchDropdown(true); }}
                  placeholder="Search places..."
                  className="w-full text-gray-800 text-sm rounded px-3 py-2 border border-gray-200 focus:border-blue-400 focus:outline-none placeholder:text-gray-400"
                />
                {showSearchDropdown && searchResults.length > 0 && (
                  <div ref={searchDropdownRef} className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-72 overflow-y-auto z-50">
                    {searchResults.map(place => (
                      <button
                        key={place.id}
                        onClick={() => handleSearchSelect(place)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-0 cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-gray-800 truncate">{place.ijmes_cornuData || place.ijmes_name || place.name}</span>
                          <span className="text-sm text-gray-500 truncate" dir="rtl">{place.nameAr}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {place.type} · {data.regions[place.region]?.display || place.region}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-1">
                <select value={searchTypeFilter} onChange={e => setSearchTypeFilter(e.target.value)}
                  className="flex-1 min-w-0 bg-white text-gray-700 text-xs rounded px-2 py-1.5 border border-gray-200">
                  {SEARCH_TYPE_OPTIONS.map(t => (
                    <option key={t} value={t}>{t === 'all' ? 'All types' : t}</option>
                  ))}
                </select>
                <select value={searchRegionFilter} onChange={e => setSearchRegionFilter(e.target.value)}
                  className="flex-1 min-w-0 bg-white text-gray-700 text-xs rounded px-2 py-1.5 border border-gray-200">
                  <option value="all">All regions</option>
                  {regionKeys.map(k => (
                    <option key={k} value={k}>{data.regions[k]?.display || k}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
      {!data && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-white">
          <div className="text-sm text-gray-500">Loading gazetteer data...</div>
        </div>
      )}
      {/* Right-side stack: Map Settings + Regions panel */}
      {data && (
        <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-2 items-end max-h-[calc(100dvh-16px)]">
          {/* Map settings panel */}
          <div className="bg-white rounded shadow border border-gray-200 p-2 max-w-[calc(100vw-16px)]">
            <button
              onClick={() => setMapSettingsOpen(v => !v)}
              className="flex items-center justify-between w-full text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <span>Map Settings</span>
              <span className="text-gray-400 ml-3">{mapSettingsOpen ? '▾' : '▸'}</span>
            </button>
            {mapSettingsOpen &&
              <div className="mt-1.5">

                {Object.keys(TILE_LAYERS).map(key => (
                  <label key={key} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer py-0.5">
                    <input type="radio" name="viewBaseLayer"
                      checked={activeLayer === key}
                      onChange={() => setActiveLayer(key)}
                      className="w-3 h-3" />
                    {TILE_LAYERS[key]?.name || 'Blank'}
                  </label>
                ))}
                <hr className="my-1.5 border-gray-200" />
                <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer mt-1">
                  <input type="checkbox" checked={showRegions}
                    onChange={e => {
                      setShowRegions(e.target.checked);
                      if (!e.target.checked) setShowRegionsKey(false);
                    }} className="w-3 h-3" />
                  Show regions
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={showWaters}
                    onChange={e => setShowWaters(e.target.checked)} className="w-3 h-3" />
                  Show water features
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer mt-1">
                  <input type="checkbox" checked={showBorders}
                    onChange={e => setShowBorders(e.target.checked)} className="w-3 h-3" />
                  Show modern borders
                </label>
              </div>}

          </div>
          {/* Regions panel - stacks below Map Settings */}
          {showRegions && data.regions && (
            <div className={`bg-white rounded shadow border border-gray-200 p-2 flex flex-col min-h-0 overflow-hidden ${showRegionsKey ? 'w-44' : 'w-auto'}`}>
              <button
                onClick={() => setShowRegionsKey(v => !v)}
                className="flex items-center justify-between w-full text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <span>Regions</span>
                <span className="text-gray-400 ml-3">{showRegionsKey ? '▾' : '▸'}</span>
              </button>
              {showRegionsKey && (
                <div className="mt-1.5 pt-1.5 overflow-y-auto border-t border-gray-100 min-h-0">
                  {Object.entries(data.regions)
                    .filter(([id]) => id !== 'NoRegion')
                    .map(([id, meta]) => {
                      const pts = data.places.filter(p => p.region === id && p.lat != null && p.lng != null);
                      return { id, meta, pts };
                    })
                    .filter(r => r.pts.length > 0)
                    .map(({ id, meta, pts }) => (
                      <button
                        key={id}
                        onClick={() => {
                          const map = mapInstanceRef.current;
                          if (!map) return;
                          const bounds = L.latLngBounds(pts.map(p => [p.lat, p.lng]));
                          map.flyToBounds(bounds, { padding: [40, 40], maxZoom: 7, duration: 0.8 });
                        }}
                        className="flex items-center gap-2 py-0.5 w-full text-left hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <span style={{
                          display: 'inline-block', width: 12, height: 12,
                          backgroundColor: meta.color || NO_REGION_COLOR,
                          border: '1px solid #ccc',
                          flexShrink: 0,
                        }} />
                        <span className="text-xs text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">{meta.display}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Map key - bottom left */}
      {data && (
        <div className="absolute bottom-8 left-2 z-[1000] bg-white rounded shadow border border-gray-200 p-2 max-w-[calc(100vw-16px)]">
          <button
            onClick={() => setMapKeyOpen(v => !v)}
            className="flex items-center justify-between w-full text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <span>Map Key</span>
            <span className="text-gray-400 ml-3">{mapKeyOpen ? '▾' : '▸'}</span>
          </button>
          {mapKeyOpen && <>
            <div className="mt-1">
              {LEGEND_TYPES.map(type => {
                const style = TYPE_STYLES[type] || { size: 4, color: '#555' };
                const diameter = style.size * 2;
                return (
                  <div key={type} className="flex items-center gap-2 py-0.5">
                    <span style={{
                      display: 'inline-block',
                      width: diameter,
                      height: diameter,
                      borderRadius: '50%',
                      backgroundColor: style.color,
                      flexShrink: 0,
                    }} />
                    <span className="text-xs text-gray-700">{TYPE_LABELS[type]}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 py-0.5">
                <svg width="20" height="4" style={{ verticalAlign: 'middle' }}>
                  <line x1="0" y1="2" x2="20" y2="2" stroke="#5c3a1e" strokeWidth="1.5" opacity="0.5" />
                </svg>
                <span className="text-xs text-gray-700">Routes</span>
              </div>
            </div>
            <hr className="my-1.5 border-gray-200" />
            <button
              onClick={() => setZoomLevelsOpen(v => !v)}
              className="flex items-center justify-between w-full text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer mb-1"
            >
              <span>Zoom Levels</span>
              <span className="text-gray-400 ml-3">{zoomLevelsOpen ? '▾' : '▸'}</span>
            </button>
            {zoomLevelsOpen && Object.entries(
              Object.entries(LABEL_TIERS).reduce((acc, [type, z]) => {
                // In the key only, group metropoles with capitals at their zoom
                const displayZ = type === 'metropoles' ? LABEL_TIERS.capitals : z;
                (acc[displayZ] ||= []).push(type);
                return acc;
              }, {})
            )
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([z, types]) => (
                <button
                  key={z}
                  onClick={() => {
                    const map = mapInstanceRef.current;
                    if (!map) return;
                    const target = Math.max(Number(z), map.getMinZoom());
                    map.flyTo(map.getCenter(), target, { duration: 0.6 });
                  }}
                  className="flex items-start py-0.5 w-full text-left hover:bg-gray-50 rounded cursor-pointer"
                >
                  <span className="text-xs text-gray-700">
                    {types.map(t => TYPE_LABELS[t] || t).join(', ')}
                  </span>
                </button>
              ))}
          </>}
        </div>
      )}
    </div>
  );
}

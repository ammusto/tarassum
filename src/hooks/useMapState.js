import { useState, useCallback, useRef } from 'react';

export const DEFAULT_NODE_STYLE = {
  shape: 'circle',
  size: 4,
  fillColor: '#000000',
  borderColor: '#000000',
  borderWidth: 1,
};

export const DEFAULT_LABEL_STYLE = {
  fontSize: 12,
  fontColor: '#000000',
  position: 'top',
  showLabel: true,
  bgBox: true,
  bgColor: 'rgba(255, 255, 255, 0.75)',
  bgOpacity: 0.8,
  bgRounded: true,
};

export const DEFAULT_ROUTE_STYLE = {
  color: '#555555',
  width: 2,
  dashStyle: 'solid',
  opacity: 1,
};

export const STATE_DEFAULTS = {
  selectedCityIds: [],
  customCities: [],
  cityStyles: {},
  labelOffsets: {},
  standaloneLabels: [],
  routeMode: 'off',
  routeStyles: {},
  activeLayer: 'terrain',
  showBorders: false,
  landColor: '#ffffff',
  waterColor: '#f0f0f0',
  landBorderColor: '#aaaaaa',
  legendEntries: [],
  legendVisible: true,
  legendPosition: { x: 20, y: 20 },
  defaultNodeStyle: DEFAULT_NODE_STYLE,
  defaultLabelStyle: DEFAULT_LABEL_STYLE,
  defaultRouteStyle: DEFAULT_ROUTE_STYLE,
};

export function useMapState() {
  const [selectedCities, setSelectedCities] = useState([]);
  const [customCities, setCustomCities] = useState([]);
  const [placementMode, setPlacementMode] = useState(false); // false | 'city' | 'label'
  const [cityStyles, setCityStyles] = useState({});

  // Label offsets: pixel offsets from auto-computed position, keyed by city/label id
  const [labelOffsets, setLabelOffsets] = useState({});

  // Standalone labels (not attached to a city)
  const [standaloneLabels, setStandaloneLabels] = useState([]);

  // Route state
  const [routeMode, setRouteMode] = useState('off');
  const [routeStyles, setRouteStyles] = useState({});

  // Display
  const [activeLayer, setActiveLayer] = useState('terrain');
  const [showBorders, setShowBorders] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [landColor, setLandColor] = useState('#ffffff');
  const [waterColor, setWaterColor] = useState('#f0f0f0');
  const [landBorderColor, setLandBorderColor] = useState('#aaaaaa');

  // Legend
  const [legendEntries, setLegendEntries] = useState([]);
  const [legendVisible, setLegendVisible] = useState(true);
  const [legendPosition, setLegendPosition] = useState({ x: 20, y: 20 });

  // Default styles
  const [defaultNodeStyle, setDefaultNodeStyle] = useState(DEFAULT_NODE_STYLE);
  const [defaultLabelStyle, setDefaultLabelStyle] = useState(DEFAULT_LABEL_STYLE);
  const [defaultRouteStyle, setDefaultRouteStyle] = useState(DEFAULT_ROUTE_STYLE);

  const nextCustomId = useRef(1);
  const nextLabelId = useRef(1);

  // --- Cities ---
  const addCity = useCallback((place) => {
    setSelectedCities(prev => {
      if (prev.find(c => c.id === place.id)) return prev;
      return [...prev, place];
    });
  }, []);

  const removeCity = useCallback((id) => {
    setSelectedCities(prev => prev.filter(c => c.id !== id));
    setCustomCities(prev => prev.filter(c => c.id !== id));
    setCityStyles(prev => { const next = { ...prev }; delete next[id]; return next; });
    setLabelOffsets(prev => { const next = { ...prev }; delete next[id]; return next; });
  }, []);

  const clearAllCities = useCallback(() => {
    setSelectedCities([]);
    setCustomCities([]);
    setCityStyles({});
    setLabelOffsets({});
  }, []);

  const addCustomCity = useCallback((lat, lng, label) => {
    const id = `custom_${nextCustomId.current++}`;
    const city = { id, name: label || 'Custom City', lat, lng, isCustom: true, nameAr: '', type: '', region: '' };
    setCustomCities(prev => [...prev, city]);
    return city;
  }, []);

  const updateCustomCity = useCallback((id, updates) => {
    setCustomCities(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  // --- Standalone labels ---
  const addStandaloneLabel = useCallback((lat, lng, text) => {
    const id = `label_${nextLabelId.current++}`;
    setStandaloneLabels(prev => [...prev, { id, lat, lng, text: text || 'Label', fontSize: 14, fontColor: '#000000' }]);
    return id;
  }, []);

  const updateStandaloneLabel = useCallback((id, updates) => {
    setStandaloneLabels(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  const removeStandaloneLabel = useCallback((id) => {
    setStandaloneLabels(prev => prev.filter(l => l.id !== id));
  }, []);

  // --- Label offsets (drag offsets in lat/lng delta) ---
  const setLabelOffset = useCallback((id, offset) => {
    setLabelOffsets(prev => ({ ...prev, [id]: offset }));
  }, []);

  // --- City styles ---
  const getCityStyle = useCallback((id) => {
    const overrides = cityStyles[id] || {};
    return {
      node: { ...defaultNodeStyle, ...(overrides.node || {}) },
      label: { ...defaultLabelStyle, ...(overrides.label || {}) },
    };
  }, [cityStyles, defaultNodeStyle, defaultLabelStyle]);

  const setCityNodeStyle = useCallback((id, style) => {
    setCityStyles(prev => ({
      ...prev,
      [id]: { ...prev[id], node: { ...(prev[id]?.node || {}), ...style } }
    }));
  }, []);

  const setCityLabelStyle = useCallback((id, style) => {
    setCityStyles(prev => ({
      ...prev,
      [id]: { ...prev[id], label: { ...(prev[id]?.label || {}), ...style } }
    }));
  }, []);

  // --- Route styles ---
  const getRouteStyle = useCallback((routeId) => {
    return { ...defaultRouteStyle, ...(routeStyles[routeId] || {}) };
  }, [routeStyles, defaultRouteStyle]);

  const setRouteStyleById = useCallback((routeId, style) => {
    setRouteStyles(prev => ({ ...prev, [routeId]: { ...(prev[routeId] || {}), ...style } }));
  }, []);

  // --- Save / Load ---
  const getCurrentState = useCallback(() => ({
    selectedCityIds: selectedCities.map(c => c.id),
    customCities,
    cityStyles,
    labelOffsets,
    standaloneLabels,
    routeMode,
    routeStyles,
    activeLayer,
    showBorders,
    landColor,
    waterColor,
    landBorderColor,
    legendEntries,
    legendVisible,
    legendPosition,
    defaultNodeStyle,
    defaultLabelStyle,
    defaultRouteStyle,
  }), [selectedCities, customCities, cityStyles, labelOffsets, standaloneLabels, routeMode, routeStyles, activeLayer, showBorders, landColor, waterColor, landBorderColor, legendEntries, legendVisible, legendPosition, defaultNodeStyle, defaultLabelStyle, defaultRouteStyle]);

  const applyState = useCallback((s, allPlaces) => {
    if (!s) return false;
    const placesById = {};
    for (const p of allPlaces) placesById[p.id] = p;
    setSelectedCities((s.selectedCityIds || []).map(id => placesById[id]).filter(Boolean));
    setCustomCities(s.customCities || []);
    setCityStyles(s.cityStyles || {});
    setLabelOffsets(s.labelOffsets || {});
    setStandaloneLabels(s.standaloneLabels || []);
    setRouteMode(s.routeMode || 'off');
    setRouteStyles(s.routeStyles || {});
    setActiveLayer(s.activeLayer || 'landmass');
    setShowBorders(s.showBorders || false);
    setLandColor(s.landColor || '#f0f0f0');
    setWaterColor(s.waterColor || '#ffffff');
    setLandBorderColor(s.landBorderColor || '#aaaaaa');
    setLegendEntries(s.legendEntries || []);
    setLegendVisible(s.legendVisible !== false);
    setLegendPosition(s.legendPosition || { x: 20, y: 20 });
    setDefaultNodeStyle(s.defaultNodeStyle || DEFAULT_NODE_STYLE);
    setDefaultLabelStyle(s.defaultLabelStyle || DEFAULT_LABEL_STYLE);
    setDefaultRouteStyle(s.defaultRouteStyle || DEFAULT_ROUTE_STYLE);

    const maxCustom = (s.customCities || []).reduce((max, c) => {
      const n = parseInt(c.id.replace('custom_', ''));
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    nextCustomId.current = maxCustom + 1;
    const maxLabel = (s.standaloneLabels || []).reduce((max, l) => {
      const n = parseInt(l.id.replace('label_', ''));
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    nextLabelId.current = maxLabel + 1;
    return true;
  }, []);

  const saveMap = useCallback((name) => {
    const saves = JSON.parse(localStorage.getItem('tarassum_saves') || '{}');
    saves[name] = { state: getCurrentState(), savedAt: new Date().toISOString() };
    localStorage.setItem('tarassum_saves', JSON.stringify(saves));
  }, [getCurrentState]);

  const loadMap = useCallback((name, allPlaces) => {
    const saves = JSON.parse(localStorage.getItem('tarassum_saves') || '{}');
    const save = saves[name];
    if (!save) return false;
    return applyState(save.state, allPlaces);
  }, [applyState]);

  const getSavedMaps = useCallback(() => {
    const saves = JSON.parse(localStorage.getItem('tarassum_saves') || '{}');
    return Object.keys(saves).map(name => ({ name, savedAt: saves[name].savedAt }));
  }, []);

  const deleteSavedMap = useCallback((name) => {
    const saves = JSON.parse(localStorage.getItem('tarassum_saves') || '{}');
    delete saves[name];
    localStorage.setItem('tarassum_saves', JSON.stringify(saves));
  }, []);

  return {
    // Cities
    selectedCities, customCities, allCities: [...selectedCities, ...customCities],
    addCity, removeCity, clearAllCities,
    addCustomCity, updateCustomCity,
    placementMode, setPlacementMode,
    // Standalone labels
    standaloneLabels, addStandaloneLabel, updateStandaloneLabel, removeStandaloneLabel,
    // Label offsets
    labelOffsets, setLabelOffset,
    // Styles
    cityStyles, getCityStyle, setCityNodeStyle, setCityLabelStyle,
    defaultNodeStyle, setDefaultNodeStyle,
    defaultLabelStyle, setDefaultLabelStyle,
    defaultRouteStyle, setDefaultRouteStyle,
    // Routes
    routeMode, setRouteMode,
    routeStyles, getRouteStyle, setRouteStyleById,
    // Display
    activeLayer, setActiveLayer,
    showBorders, setShowBorders,
    sidebarOpen, setSidebarOpen,
    landColor, setLandColor,
    waterColor, setWaterColor,
    landBorderColor, setLandBorderColor,
    // Legend
    legendEntries, setLegendEntries,
    legendVisible, setLegendVisible,
    legendPosition, setLegendPosition,
    // Save/Load
    saveMap, loadMap, getSavedMaps, deleteSavedMap,
    getCurrentState, applyState,
  };
}

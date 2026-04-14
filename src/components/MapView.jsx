import { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import LegendOverlay from './LegendOverlay.jsx';
import CityPopup from './CityPopup.jsx';
import { dijkstra } from '../utils/dijkstra.js';

const TILE_LAYERS = {
  landmass: { name: 'Landmass Only', url: null, landGeoJson: '/land10m.geojson' },
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
  relief: {
    name: 'Shaded Relief',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri',
  },
};

function createNodeIcon(style) {
  const { shape, size, fillColor, borderColor, borderWidth } = style;
  const s = size * 2;
  let svg;
  const bc = borderColor || fillColor;
  const bw = borderWidth || 1;

  if (shape === 'square') {
    svg = `<rect x="${bw}" y="${bw}" width="${s - bw * 2}" height="${s - bw * 2}" fill="${fillColor}" stroke="${bc}" stroke-width="${bw}"/>`;
  } else if (shape === 'diamond') {
    const mid = s / 2;
    svg = `<polygon points="${mid},${bw} ${s - bw},${mid} ${mid},${s - bw} ${bw},${mid}" fill="${fillColor}" stroke="${bc}" stroke-width="${bw}"/>`;
  } else if (shape === 'triangle') {
    const mid = s / 2;
    svg = `<polygon points="${mid},${bw} ${s - bw},${s - bw} ${bw},${s - bw}" fill="${fillColor}" stroke="${bc}" stroke-width="${bw}"/>`;
  } else {
    svg = `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - bw}" fill="${fillColor}" stroke="${bc}" stroke-width="${bw}"/>`;
  }

  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">${svg}</svg>`;
  const url = 'data:image/svg+xml;base64,' + btoa(svgStr);

  return L.icon({
    iconUrl: url,
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
    popupAnchor: [0, -s / 2],
  });
}

function getLabelOffset(position, nodeSize, fontSize) {
  const halfNode = nodeSize;
  const pad = 3;
  switch (position) {
    case 'bottom': return [0, halfNode + pad];
    case 'left':   return [-(halfNode + pad), 0];
    case 'right':  return [halfNode + pad, 0];
    default:       return [0, -(halfNode + fontSize + pad)];
  }
}

function bestLabelPosition(cityPt, otherPts, nodeSize) {
  const directions = ['top', 'right', 'bottom', 'left'];
  const zones = { top: 0, right: 0, bottom: 0, left: 0 };
  const threshold = nodeSize * 6;

  for (const pt of otherPts) {
    const dx = pt.x - cityPt.x;
    const dy = pt.y - cityPt.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > threshold || dist === 0) continue;
    const w = 1 - dist / threshold;
    if (Math.abs(dy) > Math.abs(dx)) {
      if (dy < 0) zones.top += w; else zones.bottom += w;
    } else {
      if (dx < 0) zones.left += w; else zones.right += w;
    }
  }

  let best = 'top';
  let bestScore = Infinity;
  for (const d of directions) {
    if (zones[d] < bestScore) { bestScore = zones[d]; best = d; }
  }
  return best;
}

export default function MapView({ data, mapState, mapInstanceRef: externalMapRef }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routesLayerRef = useRef(null);
  const bordersLayerRef = useRef(null);
  const landLayerRef = useRef(null);
  const scaleRef = useRef(null);

  const [popupCity, setPopupCity] = useState(null);
  const [popupPos, setPopupPos] = useState(null);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;
    const map = L.map(mapRef.current, {
      center: [33, 44],
      zoom: 5,
      minZoom: 3,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 120,
      zoomControl: false,
      attributionControl: true,
    });
    mapInstanceRef.current = map;
    if (externalMapRef) externalMapRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);

    scaleRef.current = L.control.scale({
      position: 'bottomright',
      metric: true,
      imperial: false,
      maxWidth: 200,
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, []);

  // Tile layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) { map.removeLayer(tileLayerRef.current); tileLayerRef.current = null; }
    if (landLayerRef.current) { map.removeLayer(landLayerRef.current); landLayerRef.current = null; }

    const cfg = TILE_LAYERS[mapState.activeLayer];
    if (cfg && cfg.url) {
      tileLayerRef.current = L.tileLayer(cfg.url, {
        attribution: cfg.attribution, maxZoom: 18,
        className: cfg.className || '',
      }).addTo(map);
    } else if (cfg && cfg.landGeoJson) {
      // Landmass Only: high-res land polygons, no borders
      // Set water color as map background
      map.getContainer().style.backgroundColor = mapState.waterColor || '#ffffff';
      fetch(cfg.landGeoJson)
        .then(r => r.json())
        .then(geojson => {
          if (TILE_LAYERS[mapState.activeLayer]?.landGeoJson !== cfg.landGeoJson) return;
          landLayerRef.current = L.geoJSON(geojson, {
            style: {
              color: mapState.landBorderColor || '#aaaaaa',
              weight: 0.8,
              fillColor: mapState.landColor || '#f0f0f0',
              fillOpacity: 1,
            },
            interactive: false,
          }).addTo(map);
          landLayerRef.current.bringToBack();
        }).catch(() => {});
    } else {
      map.getContainer().style.backgroundColor = '#ffffff';
    }
  }, [mapState.activeLayer, mapState.landColor, mapState.waterColor, mapState.landBorderColor]);

  // Borders overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (bordersLayerRef.current) { map.removeLayer(bordersLayerRef.current); bordersLayerRef.current = null; }
    if (mapState.showBorders) {
      fetch('/borders.geojson')
        .then(r => r.json())
        .then(geojson => {
          bordersLayerRef.current = L.geoJSON(geojson, {
            style: { color: '#999', weight: 1, fillOpacity: 0, dashArray: '4 3' }
          }).addTo(map);
        }).catch(() => {});
    }
  }, [mapState.showBorders]);

  // Placement mode (city or label)
  const handlePlacement = useCallback((e) => {
    if (!mapState.placementMode) return;
    if (mapState.placementMode === 'city') {
      const label = prompt('Enter city name:');
      if (label !== null) mapState.addCustomCity(e.latlng.lat, e.latlng.lng, label);
    } else if (mapState.placementMode === 'label') {
      const text = prompt('Enter label text:');
      if (text !== null) mapState.addStandaloneLabel(e.latlng.lat, e.latlng.lng, text);
    }
    mapState.setPlacementMode(false);
  }, [mapState.placementMode, mapState.addCustomCity, mapState.addStandaloneLabel, mapState.setPlacementMode]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (mapState.placementMode) {
      map.on('click', handlePlacement);
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.off('click', handlePlacement);
      map.getContainer().style.cursor = '';
    }
    return () => { map.off('click', handlePlacement); };
  }, [mapState.placementMode, handlePlacement]);

  // Render markers, labels, standalone labels
  useEffect(() => {
    const layer = markersLayerRef.current;
    const map = mapInstanceRef.current;
    if (!layer || !map) return;
    layer.clearLayers();

    const allCities = [...mapState.selectedCities, ...mapState.customCities];
    const pixelPts = allCities.map(c => map.latLngToContainerPoint([c.lat, c.lng]));

    for (let i = 0; i < allCities.length; i++) {
      const city = allCities[i];
      const style = mapState.getCityStyle(city.id);
      const nodeStyle = style.node;
      const labelStyle = style.label;

      const icon = createNodeIcon(nodeStyle);
      const marker = L.marker([city.lat, city.lng], {
        icon,
        draggable: !!city.isCustom,
        zIndexOffset: city.isCustom ? 500 : 0,
      });

      // Click → open style popup
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        const containerPt = map.latLngToContainerPoint(e.latlng);
        setPopupCity(city);
        setPopupPos({ x: containerPt.x, y: containerPt.y });
      });

      if (city.isCustom) {
        marker.on('dragend', (e) => {
          const ll = e.target.getLatLng();
          mapState.updateCustomCity(city.id, { lat: ll.lat, lng: ll.lng });
        });
      }

      marker.addTo(layer);

      // Label (draggable)
      if (labelStyle.showLabel) {
        const displayName = labelStyle.customLabel || city.ijmes_name || city.name;
        const hasManualPosition = mapState.cityStyles[city.id]?.label?.position;
        const position = hasManualPosition
          ? labelStyle.position
          : bestLabelPosition(pixelPts[i], pixelPts.filter((_, j) => j !== i), nodeStyle.size);
        const autoOffset = getLabelOffset(position, nodeStyle.size, labelStyle.fontSize);

        // If user has dragged this label, use stored pixel anchor; otherwise auto
        const storedAnchor = mapState.labelOffsets[city.id] || null;
        const anchorX = storedAnchor ? storedAnchor.dx : -autoOffset[0];
        const anchorY = storedAnchor ? storedAnchor.dy : -autoOffset[1];

        const labelHtml = `<span style="
          font-size: ${labelStyle.fontSize}px;
          color: ${labelStyle.fontColor};
          ${labelStyle.bgBox ? `background: ${labelStyle.bgColor}; padding: 1px 4px; border-radius: ${labelStyle.bgRounded ? '3px' : '0'};` : ''}
        ">${displayName}</span>`;

        const labelMarker = L.marker([city.lat, city.lng], {
          icon: L.divIcon({
            className: 'city-label',
            html: labelHtml,
            iconAnchor: [anchorX, anchorY],
          }),
          draggable: true,
          interactive: true,
          zIndexOffset: 1000,
        });

        const cityId = city.id;
        const cityLat = city.lat;
        const cityLng = city.lng;
        labelMarker.on('dragend', (e) => {
          const ll = e.target.getLatLng();
          // Where is the city on screen?
          const cityPt = map.latLngToContainerPoint([cityLat, cityLng]);
          // Where did the user drag the label to on screen?
          const draggedPt = map.latLngToContainerPoint(ll);
          // The icon's top-left corner was at: draggedPt - currentAnchor
          // We want that same top-left when marker is back at cityPt
          // newAnchor = cityPt - topLeft = cityPt - (draggedPt - oldAnchor)
          const currentIcon = e.target.getIcon();
          const oldAnchor = currentIcon.options.iconAnchor;
          const newAnchorX = cityPt.x - draggedPt.x + oldAnchor[0];
          const newAnchorY = cityPt.y - draggedPt.y + oldAnchor[1];
          // Snap marker back and store pixel anchor
          e.target.setLatLng([cityLat, cityLng]);
          mapState.setLabelOffset(cityId, { dx: newAnchorX, dy: newAnchorY });
        });

        const labelCity = city;
        labelMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          const containerPt = map.latLngToContainerPoint(e.latlng);
          setPopupCity(labelCity);
          setPopupPos({ x: containerPt.x, y: containerPt.y });
        });

        labelMarker.addTo(layer);
      }
    }

    // Standalone labels
    for (const lbl of mapState.standaloneLabels) {
      const labelHtml = `<span style="
        font-size: ${lbl.fontSize}px;
        color: ${lbl.fontColor};
      ">${lbl.text}</span>`;

      const labelMarker = L.marker([lbl.lat, lbl.lng], {
        icon: L.divIcon({
          className: 'city-label',
          html: labelHtml,
          iconAnchor: [0, 0],
        }),
        draggable: true,
        interactive: true,
        zIndexOffset: 1000,
      });

      labelMarker.on('dragend', (e) => {
        const ll = e.target.getLatLng();
        mapState.updateStandaloneLabel(lbl.id, { lat: ll.lat, lng: ll.lng });
      });

      labelMarker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        const containerPt = map.latLngToContainerPoint(e.latlng);
        setPopupCity({ ...lbl, isStandaloneLabel: true });
        setPopupPos({ x: containerPt.x, y: containerPt.y });
      });

      labelMarker.addTo(layer);
    }
  }, [mapState.selectedCities, mapState.customCities, mapState.cityStyles, mapState.defaultNodeStyle, mapState.defaultLabelStyle, mapState.getCityStyle, mapState.labelOffsets, mapState.standaloneLabels]);

  // Render routes
  useEffect(() => {
    const layer = routesLayerRef.current;
    if (!layer || !data) return;
    layer.clearLayers();
    if (mapState.routeMode === 'off') return;

    const allCityIds = [...mapState.selectedCities, ...mapState.customCities]
      .map(c => c.id).filter(id => data.graph[id]);

    const routeIdSet = new Set();

    if (mapState.routeMode === 'pairwise') {
      // All pairwise shortest paths
      for (let i = 0; i < allCityIds.length; i++) {
        for (let j = i + 1; j < allCityIds.length; j++) {
          const result = dijkstra(data.graph, allCityIds[i], allCityIds[j]);
          if (result) {
            for (const step of result.path) {
              if (step.routeId) routeIdSet.add(step.routeId);
            }
          }
        }
      }
    } else if (mapState.routeMode === 'network') {
      // Minimum spanning tree over shortest-path distances
      if (allCityIds.length >= 2) {
        // Compute all pairwise shortest paths with distances
        const edges = [];
        const pathCache = {};
        for (let i = 0; i < allCityIds.length; i++) {
          for (let j = i + 1; j < allCityIds.length; j++) {
            const result = dijkstra(data.graph, allCityIds[i], allCityIds[j]);
            if (result) {
              const key = `${allCityIds[i]}|${allCityIds[j]}`;
              pathCache[key] = result.path;
              edges.push({ i, j, dist: result.distance, key });
            }
          }
        }
        // Kruskal's MST
        edges.sort((a, b) => a.dist - b.dist);
        const parent = allCityIds.map((_, idx) => idx);
        const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
        const union = (a, b) => { parent[find(a)] = find(b); };
        let edgesUsed = 0;
        for (const edge of edges) {
          if (find(edge.i) !== find(edge.j)) {
            union(edge.i, edge.j);
            edgesUsed++;
            const path = pathCache[edge.key];
            if (path) {
              for (const step of path) {
                if (step.routeId) routeIdSet.add(step.routeId);
              }
            }
            if (edgesUsed === allCityIds.length - 1) break;
          }
        }
      }
    }

    for (const rid of routeIdSet) {
      const route = data.routesById[rid];
      if (!route) continue;
      const style = mapState.getRouteStyle(rid);
      const latLngs = route.coords.map(c => [c[1], c[0]]);
      let dashArray = null;
      if (style.dashStyle === 'dashed') dashArray = '8 6';
      else if (style.dashStyle === 'dotted') dashArray = '2 4';
      else if (style.dashStyle === 'dash-dot') dashArray = '8 4 2 4';

      L.polyline(latLngs, {
        color: style.color, weight: style.width, opacity: style.opacity, dashArray,
      }).addTo(layer);
    }
  }, [data, mapState.routeMode, mapState.selectedCities, mapState.customCities,
      mapState.routeStyles, mapState.defaultRouteStyle, mapState.getRouteStyle]);

  // Close popup when clicking map background
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const close = () => { setPopupCity(null); setPopupPos(null); };
    map.on('click', close);
    return () => map.off('click', close);
  }, []);

  return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full" />

      {/* Layer switcher */}
      <div className="absolute top-20 right-3 z-[1000] bg-white rounded shadow border border-gray-200 p-2">
        <div className="text-xs font-medium text-gray-500 mb-1.5">Base Layer</div>
        {Object.keys(TILE_LAYERS).map(key => (
          <label key={key} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer py-0.5">
            <input type="radio" name="baseLayer"
              checked={mapState.activeLayer === key}
              onChange={() => mapState.setActiveLayer(key)}
              className="w-3 h-3" />
            {TILE_LAYERS[key]?.name || 'Blank'}
          </label>
        ))}
        <hr className="my-1.5 border-gray-200" />
        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
          <input type="checkbox" checked={mapState.showBorders}
            onChange={e => mapState.setShowBorders(e.target.checked)} className="w-3 h-3" />
          Modern borders
        </label>
      </div>

      {/* City style popup */}
      {popupCity && popupPos && (
        <CityPopup
          city={popupCity}
          pos={popupPos}
          mapState={mapState}
          onClose={() => { setPopupCity(null); setPopupPos(null); }}
          containerRef={mapRef}
        />
      )}

      {/* Legend overlay */}
      {mapState.legendVisible && mapState.legendEntries.length > 0 && (
        <LegendOverlay mapState={mapState} />
      )}
    </div>
  );
}

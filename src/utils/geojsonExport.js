import { dijkstra } from './dijkstra.js';

function computeRouteIds(data, allCityIds, routeMode) {
  const routeIdSet = new Set();
  if (routeMode === 'pairwise') {
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
  } else if (routeMode === 'network' && allCityIds.length >= 2) {
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
  return routeIdSet;
}

function cityProperties(city, source) {
  const props = {
    name: city.ijmes_cornuData || city.ijmes_name || city.name,
    isCustom: !!city.isCustom,
    source,
  };
  if (city.nameAr) props.nameAr = city.nameAr;
  if (city.type) props.type = city.type;
  if (city.region) props.region = city.region;
  return props;
}

export function buildGeoJSON(data, mapState) {
  const features = [];

  for (const city of mapState.selectedCities) {
    if (city.lat == null || city.lng == null) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [city.lng, city.lat] },
      properties: cityProperties(city, 'selected'),
    });
  }

  for (const city of mapState.customCities) {
    if (city.lat == null || city.lng == null) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [city.lng, city.lat] },
      properties: cityProperties(city, 'custom'),
    });
  }

  for (const label of mapState.standaloneLabels || []) {
    if (label.lat == null || label.lng == null) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [label.lng, label.lat] },
      properties: {
        type: 'standalone-label',
        label: label.text,
        fontSize: label.fontSize,
        fontColor: label.fontColor,
      },
    });
  }

  if (data?.graph && data?.routesById && mapState.routeMode && mapState.routeMode !== 'off') {
    const allCityIds = [...mapState.selectedCities, ...mapState.customCities]
      .map(c => c.id)
      .filter(id => data.graph[id]);
    const routeIds = computeRouteIds(data, allCityIds, mapState.routeMode);
    for (const rid of routeIds) {
      const route = data.routesById[rid];
      if (!route) continue;
      const style = mapState.getRouteStyle ? mapState.getRouteStyle(rid) : (mapState.defaultRouteStyle || {});
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: route.coords },
        properties: {
          routeId: rid,
          color: style.color,
          width: style.width,
          opacity: style.opacity,
          dashStyle: style.dashStyle,
        },
      });
    }
  }

  return { type: 'FeatureCollection', features };
}

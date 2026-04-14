const fs = require('fs');
const path = require('path');

const rawDir = path.join(__dirname, 'data', 'raw');
const outFile = path.join(__dirname, 'public', 'thurayya_data.json');

// Load raw data
const placesGeo = JSON.parse(fs.readFileSync(path.join(rawDir, 'places_new_structure.geojson'), 'utf8'));
const routesGeo = JSON.parse(fs.readFileSync(path.join(rawDir, 'routes.json'), 'utf8'));
const regionsRaw = JSON.parse(fs.readFileSync(path.join(rawDir, 'regions.json'), 'utf8'));

// Process places
const places = placesGeo.features.map(f => {
  const d = f.properties.althurayyaData;
  const names = d.names || {};
  const eng = names.eng || {};
  const ara = names.ara || {};

  // Name priority: eng.translit -> eng.common -> eng.search (first value) -> ara.common -> URI
  let name = eng.translit || eng.common;
  if (!name && eng.search) name = eng.search.split(',')[0].trim();
  if (!name) name = ara.common || d.URI;

  return {
    id: d.URI,
    name,
    nameAr: ara.common || '',
    search: eng.search || '',
    lng: parseFloat(f.geometry.coordinates[0].toFixed(4)),
    lat: parseFloat(f.geometry.coordinates[1].toFixed(4)),
    type: d.top_type || '',
    region: d.region_URI || '',
    cornuData: eng.common || name
  };
});

// Process routes - simplify coords (keep every 2nd point, always first/last)
const routes = routesGeo.features.map(f => {
  const p = f.properties;
  const coords = f.geometry.coordinates;

  // Simplify: keep every 2nd point, always keep first and last
  const simplified = [];
  for (let i = 0; i < coords.length; i++) {
    if (i === 0 || i === coords.length - 1 || i % 2 === 0) {
      simplified.push([
        parseFloat(coords[i][0].toFixed(3)),
        parseFloat(coords[i][1].toFixed(3))
      ]);
    }
  }

  return {
    s: p.sToponym,
    e: p.eToponym,
    id: p.id,
    m: Math.round(p.Meter),
    coords: simplified
  };
});

// Build adjacency list graph
const graph = {};
for (const r of routes) {
  if (!graph[r.s]) graph[r.s] = [];
  if (!graph[r.e]) graph[r.e] = [];
  graph[r.s].push({ to: r.e, dist: r.m, rid: r.id });
  graph[r.e].push({ to: r.s, dist: r.m, rid: r.id });
}

// Build regions lookup
const regions = {};
for (const [key, val] of Object.entries(regionsRaw)) {
  regions[key] = { code: val.region_code, display: val.display, color: val.color };
}

const output = { places, routes, graph, regions };
const json = JSON.stringify(output);

fs.writeFileSync(outFile, json, 'utf8');

console.log(`Places: ${places.length}`);
console.log(`Routes: ${routes.length}`);
console.log(`Graph nodes: ${Object.keys(graph).length}`);
console.log(`Regions: ${Object.keys(regions).length}`);
console.log(`Output size: ${(json.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`Written to: ${outFile}`);

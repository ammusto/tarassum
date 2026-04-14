import Fuse from 'fuse.js';

let cachedData = null;
let fuseIndex = null;

export async function loadData() {
  if (cachedData) return cachedData;
  const resp = await fetch('/thurayya_data.json');
  cachedData = await resp.json();

  // Build place lookup by id
  cachedData.placesById = {};
  for (const p of cachedData.places) {
    cachedData.placesById[p.id] = p;
  }

  // Build route lookup by id
  cachedData.routesById = {};
  for (const r of cachedData.routes) {
    cachedData.routesById[r.id] = r;
  }

  // Build fuse index for fuzzy search
  fuseIndex = new Fuse(cachedData.places, {
    keys: [
      { name: 'ijmes_name', weight: 3 },
      { name: 'ijmes_cornuData', weight: 2.5 },
      { name: 'name', weight: 2 },
      { name: 'cornuData', weight: 2 },
      { name: 'nameAr', weight: 2 },
      { name: 'search', weight: 1.5 },
      { name: 'id', weight: 0.5 }
    ],
    threshold: 0.35,
    distance: 100,
    includeScore: true,
    minMatchCharLength: 2,
  });

  return cachedData;
}

export function searchPlaces(query, limit = 30) {
  if (!fuseIndex || !query || query.length < 1) return [];
  return fuseIndex.search(query, { limit }).map(r => r.item);
}

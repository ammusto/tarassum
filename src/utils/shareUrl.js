import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { STATE_DEFAULTS } from '../hooks/useMapState.js';

const FORMAT = 'tarassum-map';
const VERSION = 2;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const CODE_LEN = 2;

function isDefault(value, defaultValue) {
  return JSON.stringify(value) === JSON.stringify(defaultValue);
}

function stripDefaults(state) {
  const out = {};
  for (const [key, value] of Object.entries(state)) {
    if (key in STATE_DEFAULTS && isDefault(value, STATE_DEFAULTS[key])) continue;
    out[key] = value;
  }
  return out;
}

function fillDefaults(state) {
  return { ...STATE_DEFAULTS, ...state };
}

function indexToCode(i) {
  return ALPHABET[Math.floor(i / 62)] + ALPHABET[i % 62];
}

function codeToIndex(code) {
  return ALPHABET.indexOf(code[0]) * 62 + ALPHABET.indexOf(code[1]);
}

function buildCityMaps(places) {
  const sorted = [...places].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  if (sorted.length > 62 * 62) {
    throw new Error(`Gazetteer exceeds ${62 * 62} places; bump CODE_LEN`);
  }
  const idToCode = new Map();
  const codeToId = new Map();
  sorted.forEach((p, i) => {
    const code = indexToCode(i);
    idToCode.set(p.id, code);
    codeToId.set(code, p.id);
  });
  return { idToCode, codeToId };
}

function packCities(state, places) {
  const { idToCode } = buildCityMaps(places);
  const codes = (state.selectedCityIds || [])
    .map(id => idToCode.get(id))
    .filter(Boolean)
    .join('');
  const { selectedCityIds, ...rest } = state;
  if (codes) rest.c = codes;
  return rest;
}

function unpackCities(state, places) {
  if (typeof state.c !== 'string') return state;
  const { codeToId } = buildCityMaps(places);
  const ids = [];
  for (let i = 0; i < state.c.length; i += CODE_LEN) {
    const id = codeToId.get(state.c.slice(i, i + CODE_LEN));
    if (id) ids.push(id);
  }
  const { c, ...rest } = state;
  return { ...rest, selectedCityIds: ids };
}

export function encodeState(state, places) {
  let slim = places ? packCities(state, places) : state;
  slim = stripDefaults(slim);
  const payload = { format: FORMAT, version: VERSION, state: slim };
  return compressToEncodedURIComponent(JSON.stringify(payload));
}

export function decodeState(str, places) {
  const json = decompressFromEncodedURIComponent(str);
  if (!json) throw new Error('Could not decode share data');
  const parsed = JSON.parse(json);
  const wire = parsed.state || parsed;
  if (!wire || typeof wire !== 'object') throw new Error('Invalid share data');
  const unpacked = places ? unpackCities(wire, places) : wire;
  return fillDefaults(unpacked);
}

export function buildShareUrl(state, places) {
  return `${window.location.origin}/make#m=${encodeState(state, places)}`;
}

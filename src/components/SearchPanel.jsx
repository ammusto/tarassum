import { useState, useRef, useEffect, useMemo } from 'react';
import { searchPlaces } from '../data/loader.js';

const TYPE_OPTIONS = ['all', 'metropoles', 'capitals', 'towns', 'waystations', 'villages', 'xroads', 'waters', 'sites'];

export default function SearchPanel({ data, mapState }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // City search: exclude regions
  useEffect(() => {
    if (!query || query.length < 1) { setResults([]); return; }
    let res = searchPlaces(query, 50).filter(p => p.type !== 'regions' && p.type !== 'quarters');
    if (typeFilter !== 'all') res = res.filter(p => p.type === typeFilter);
    if (regionFilter !== 'all') res = res.filter(p => p.region === regionFilter);
    setResults(res.slice(0, 30));
    setShowDropdown(true);
  }, [query, typeFilter, regionFilter]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (place) => {
    mapState.addCity(place);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  };

  const regionKeys = useMemo(
    () => (data ? Object.keys(data.regions).sort() : []),
    [data]
  );

  return (
    <div className="space-y-3">
      {/* City search */}
      <div>
        <div className="text-xs text-gray-600 font-medium mb-1">Cities</div>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => { if (results.length) setShowDropdown(true); }}
            placeholder="Search cities..."
            className="w-full bg-surface text-gray-800 text-sm rounded px-3 py-2 border border-sidebar-border focus:border-accent focus:outline-none placeholder:text-gray-400"
          />
          {showDropdown && results.length > 0 && (
            <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-1 bg-surface border border-sidebar-border rounded shadow-lg max-h-72 overflow-y-auto z-50">
              {results.map(place => (
                <button
                  key={place.id}
                  onClick={() => handleSelect(place)}
                  className="w-full text-left px-3 py-2 hover:bg-sidebar-hover border-b border-sidebar-border last:border-0 cursor-pointer"
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
        {/* Filters */}
        <div className="flex gap-2 mt-1">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="flex-1 bg-surface text-gray-700 text-xs rounded px-2 py-1.5 border border-sidebar-border">
            {TYPE_OPTIONS.map(t => (
              <option key={t} value={t}>{t === 'all' ? 'All types' : t}</option>
            ))}
          </select>
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
            className="flex-1 bg-surface text-gray-700 text-xs rounded px-2 py-1.5 border border-sidebar-border">
            <option value="all">All regions</option>
            {regionKeys.map(k => (
              <option key={k} value={k}>{data.regions[k]?.display || k}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom city + Add label buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => mapState.setPlacementMode('city')}
          className={`flex-1 text-xs py-1.5 rounded border cursor-pointer ${
            mapState.placementMode === 'city'
              ? 'bg-accent text-white border-accent'
              : 'bg-surface text-gray-700 border-sidebar-border hover:bg-sidebar-hover'
          }`}
        >
          {mapState.placementMode === 'city' ? '✛ Click map...' : '+ Custom City'}
        </button>
        <button
          onClick={() => mapState.setPlacementMode('label')}
          className={`flex-1 text-xs py-1.5 rounded border cursor-pointer ${
            mapState.placementMode === 'label'
              ? 'bg-accent text-white border-accent'
              : 'bg-surface text-gray-700 border-sidebar-border hover:bg-sidebar-hover'
          }`}
        >
          {mapState.placementMode === 'label' ? '✛ Click map...' : '+ Add Label'}
        </button>
      </div>
    </div>
  );
}

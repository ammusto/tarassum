import { useCallback } from 'react';

export default function LegendPanel({ mapState }) {
  const { legendEntries, setLegendEntries, legendVisible, setLegendVisible } = mapState;

  const addEntry = useCallback((type = 'node') => {
    setLegendEntries(prev => [
      ...prev,
      {
        id: Date.now(),
        type, // 'node' or 'line'
        label: type === 'node' ? 'City' : 'Route',
        shape: 'circle',
        color: '#000000',
        dashStyle: 'solid',
      }
    ]);
  }, [setLegendEntries]);

  const updateEntry = useCallback((id, updates) => {
    setLegendEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, [setLegendEntries]);

  const removeEntry = useCallback((id) => {
    setLegendEntries(prev => prev.filter(e => e.id !== id));
  }, [setLegendEntries]);

  const autoGenerate = useCallback(() => {
    const entries = [];
    // Collect unique node styles
    const nodeStyles = new Map();
    const allCities = [...mapState.selectedCities, ...mapState.customCities];
    for (const city of allCities) {
      const s = mapState.getCityStyle(city.id).node;
      const key = `${s.shape}-${s.fillColor}`;
      if (!nodeStyles.has(key)) {
        nodeStyles.set(key, { shape: s.shape, color: s.fillColor });
      }
    }
    for (const [, style] of nodeStyles) {
      entries.push({
        id: Date.now() + Math.random(),
        type: 'node',
        label: 'City',
        shape: style.shape,
        color: style.color,
      });
    }

    // Add a route entry if routes are shown
    if (mapState.routeMode !== 'off') {
      entries.push({
        id: Date.now() + Math.random() + 1,
        type: 'line',
        label: 'Route',
        color: mapState.defaultRouteStyle.color,
        dashStyle: mapState.defaultRouteStyle.dashStyle,
      });
    }

    setLegendEntries(entries);
  }, [mapState.selectedCities, mapState.customCities, mapState.getCityStyle, mapState.routeMode, mapState.defaultRouteStyle, setLegendEntries]);

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1 text-gray-700">
          <input type="checkbox" checked={legendVisible}
            onChange={e => setLegendVisible(e.target.checked)} />
          Show legend
        </label>
        <button onClick={autoGenerate}
          className="text-black hover:text-gray-600 underline cursor-pointer">Auto-generate</button>
      </div>

      {legendEntries.map(entry => (
        <div key={entry.id} className="flex items-center gap-2 bg-surface rounded px-2 py-1">
          {/* Preview */}
          {entry.type === 'node' ? (
            <svg width="14" height="14">
              {entry.shape === 'square' ?
                <rect x="1" y="1" width="12" height="12" fill={entry.color} /> :
              entry.shape === 'diamond' ?
                <polygon points="7,1 13,7 7,13 1,7" fill={entry.color} /> :
              entry.shape === 'triangle' ?
                <polygon points="7,1 13,13 1,13" fill={entry.color} /> :
                <circle cx="7" cy="7" r="6" fill={entry.color} />
              }
            </svg>
          ) : (
            <svg width="20" height="14">
              <line x1="0" y1="7" x2="20" y2="7" stroke={entry.color} strokeWidth="2"
                strokeDasharray={entry.dashStyle === 'dashed' ? '4 3' : entry.dashStyle === 'dotted' ? '1 3' : 'none'} />
            </svg>
          )}
          <input
            type="text"
            value={entry.label}
            onChange={e => updateEntry(entry.id, { label: e.target.value })}
            className="flex-1 bg-transparent text-gray-700 border-b border-sidebar-border focus:border-accent focus:outline-none"
          />
          <input type="color" value={entry.color}
            onChange={e => updateEntry(entry.id, { color: e.target.value })}
            className="w-5 h-4 border-0 bg-transparent cursor-pointer" />
          <button onClick={() => removeEntry(entry.id)}
            className="text-gray-500 hover:text-red-400 cursor-pointer">✕</button>
        </div>
      ))}

      <div className="flex gap-2">
        <button onClick={() => addEntry('node')}
          className="flex-1 bg-surface text-gray-700 rounded py-1 border border-sidebar-border hover:bg-sidebar-hover cursor-pointer">
          + Node entry
        </button>
        <button onClick={() => addEntry('line')}
          className="flex-1 bg-surface text-gray-700 rounded py-1 border border-sidebar-border hover:bg-sidebar-hover cursor-pointer">
          + Line entry
        </button>
      </div>
    </div>
  );
}

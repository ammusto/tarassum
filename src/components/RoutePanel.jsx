const DASH_STYLES = ['solid', 'dashed', 'dotted', 'dash-dot'];

const MODES = [
  { value: 'off', label: 'Off' },
  { value: 'pairwise', label: 'All Pairwise' },
  { value: 'network', label: 'Shortest Network' },
];

export default function RoutePanel({ data, mapState }) {
  return (
    <div className="space-y-3 text-xs">
      <div>
        <div className="text-gray-600 font-medium mb-1">Mode</div>
        <div className="flex gap-1">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => mapState.setRouteMode(m.value)}
              className={`px-2 py-1 rounded cursor-pointer text-xs font-medium ${
                mapState.routeMode === m.value
                  ? 'bg-accent text-white'
                  : 'bg-surface text-gray-700 border border-sidebar-border hover:bg-sidebar-hover'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-gray-500 leading-relaxed">
        {mapState.routeMode === 'off' && 'Select a mode to show routes between selected cities.'}
        {mapState.routeMode === 'pairwise' && 'Showing shortest path between every pair of selected cities.'}
        {mapState.routeMode === 'network' && 'Showing the shortest network connecting all selected cities (minimum spanning tree).'}
      </p>

      {/* Route style */}
      <div className="space-y-1">
        <div className="text-gray-600 font-medium">Route Style</div>
        <div className="flex gap-2 flex-wrap">
          <label className="flex items-center gap-1 text-gray-700">
            Color
            <input type="color" value={mapState.defaultRouteStyle.color}
              onChange={e => mapState.setDefaultRouteStyle(prev => ({ ...prev, color: e.target.value }))}
              className="w-6 h-5 border-0 bg-transparent cursor-pointer" />
          </label>
          <label className="flex items-center gap-1 text-gray-700">
            Width
            <input type="number" min="1" max="10" value={mapState.defaultRouteStyle.width}
              onChange={e => mapState.setDefaultRouteStyle(prev => ({ ...prev, width: parseInt(e.target.value) || 2 }))}
              className="bg-surface text-gray-700 rounded px-1 py-0.5 border border-sidebar-border w-12" />
          </label>
          <label className="flex items-center gap-1 text-gray-700">
            Style
            <select value={mapState.defaultRouteStyle.dashStyle}
              onChange={e => mapState.setDefaultRouteStyle(prev => ({ ...prev, dashStyle: e.target.value }))}
              className="bg-surface text-gray-700 rounded px-1 py-0.5 border border-sidebar-border">
              {DASH_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

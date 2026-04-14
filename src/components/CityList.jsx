export default function CityList({ data, mapState }) {
  const allCities = [...mapState.selectedCities, ...mapState.customCities];

  if (allCities.length === 0 && mapState.standaloneLabels.length === 0) {
    return <div className="text-xs text-gray-500 py-2">No cities selected. Use search above to add cities.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-600">{allCities.length} cities</span>
        <button
          onClick={mapState.clearAllCities}
          className="text-xs text-gray-500 hover:text-red-400 cursor-pointer"
        >
          Clear all
        </button>
      </div>
      <div className="max-h-60 overflow-y-auto space-y-0">
        {allCities.map(city => (
          <div key={city.id} className="flex items-center gap-2 py-1 border-b border-sidebar-border last:border-0 group">
            <span className="flex-1 text-sm text-gray-800 truncate">
              {city.ijmes_cornuData || city.ijmes_name || city.name}
              {city.isCustom && <span className="text-xs text-gray-500 ml-1">(custom)</span>}
            </span>
            <button
              onClick={() => mapState.removeCity(city.id)}
              className="text-gray-500 hover:text-red-400 text-xs px-1 opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Remove"
            >✕</button>
          </div>
        ))}
      </div>

      {/* Standalone labels */}
      {mapState.standaloneLabels.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-gray-600 mb-1">{mapState.standaloneLabels.length} labels</div>
          {mapState.standaloneLabels.map(lbl => (
            <div key={lbl.id} className="flex items-center gap-2 py-1 border-b border-sidebar-border last:border-0 group">
              <span className="flex-1 text-sm text-gray-800 truncate italic">{lbl.text}</span>
              <button
                onClick={() => mapState.removeStandaloneLabel(lbl.id)}
                className="text-gray-500 hover:text-red-400 text-xs px-1 opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Remove"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">Click a city node on the map to edit its style.</p>
    </div>
  );
}

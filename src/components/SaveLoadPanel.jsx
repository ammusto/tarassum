import { useState, useEffect } from 'react';

export default function SaveLoadPanel({ data, mapState }) {
  const [saveName, setSaveName] = useState('');
  const [saves, setSaves] = useState([]);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setSaves(mapState.getSavedMaps());
  }, [mapState.getSavedMaps]);

  const handleSave = () => {
    if (!saveName.trim()) return;
    mapState.saveMap(saveName.trim());
    setSaveName('');
    setSaves(mapState.getSavedMaps());
  };

  const handleLoad = (name) => {
    if (!data) return;
    mapState.loadMap(name, data.places);
  };

  const handleDelete = (name) => {
    mapState.deleteSavedMap(name);
    setSaves(mapState.getSavedMaps());
  };

  const handleClearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    localStorage.removeItem('tarassum_saves');
    setSaves(mapState.getSavedMaps());
    setConfirmClear(false);
  };

  return (
    <div className="space-y-2 text-xs">
      {/* Save */}
      <div className="flex gap-1">
        <input
          type="text"
          value={saveName}
          onChange={e => setSaveName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
          placeholder="Map name..."
          className="flex-1 bg-surface text-gray-700 rounded px-2 py-1.5 border border-sidebar-border focus:border-accent focus:outline-none placeholder:text-gray-400"
        />
        <button onClick={handleSave}
          className="bg-accent text-white rounded px-3 py-1.5 hover:bg-accent-hover cursor-pointer">
          Save
        </button>
      </div>

      {/* Saved maps */}
      {saves.length === 0 ? (
        <div className="text-gray-500">No saved maps yet.</div>
      ) : (
        <div className="space-y-1">
          {saves.map(s => (
            <div key={s.name} className="flex items-center justify-between bg-surface rounded px-2 py-1.5 group">
              <button onClick={() => handleLoad(s.name)}
                className="flex-1 text-left text-gray-700 hover:text-black truncate cursor-pointer">
                {s.name}
              </button>
              <button onClick={() => handleDelete(s.name)}
                className="text-gray-500 hover:text-red-400 ml-2 opacity-0 group-hover:opacity-100 cursor-pointer">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Clear local data */}
      <div className="pt-2 border-t border-sidebar-border">
        <button onClick={handleClearAll}
          onBlur={() => setConfirmClear(false)}
          className="w-full text-left text-gray-500 hover:text-red-500 cursor-pointer py-1">
          {confirmClear ? 'Click again to confirm: deletes all saved maps' : 'Clear local data'}
        </button>
      </div>
    </div>
  );
}

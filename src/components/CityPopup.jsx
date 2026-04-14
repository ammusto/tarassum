const SHAPES = ['circle', 'square', 'diamond', 'triangle'];
const POSITIONS = ['top', 'bottom', 'left', 'right'];

function popupPosition(pos, containerWidth, containerHeight) {
  // Place popup to the right and below by default, but flip if near edges
  const popupW = 240;
  const popupH = 320;
  let left = pos.x + 20;
  let top = pos.y + 20;

  if (left + popupW > containerWidth) left = pos.x - popupW - 20;
  if (top + popupH > containerHeight) top = pos.y - popupH - 20;
  if (left < 0) left = 10;
  if (top < 0) top = 10;

  return { left, top };
}

export default function CityPopup({ city, pos, mapState, onClose, containerRef }) {
  const cw = containerRef?.current?.clientWidth || window.innerWidth;
  const ch = containerRef?.current?.clientHeight || window.innerHeight;
  const { left, top } = popupPosition(pos, cw, ch);

  // Standalone label popup
  if (city.isStandaloneLabel) {
    return (
      <div
        className="absolute z-[2000] bg-white rounded shadow-lg border border-gray-200 p-3 text-xs"
        style={{ left, top, minWidth: 180 }}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-gray-700">Label</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
        </div>
        <input type="text" value={city.text}
          onChange={e => mapState.updateStandaloneLabel(city.id, { text: e.target.value })}
          className="w-full border border-gray-200 rounded px-2 py-1 mb-2 text-gray-700" />
        <div className="flex gap-2">
          <label className="flex items-center gap-1 text-gray-600">
            Size
            <input type="number" min="8" max="48" value={city.fontSize}
              onChange={e => mapState.updateStandaloneLabel(city.id, { fontSize: parseInt(e.target.value) || 14 })}
              className="border border-gray-200 rounded px-1 py-0.5 w-12" />
          </label>
          <label className="flex items-center gap-1 text-gray-600">
            Color
            <input type="color" value={city.fontColor}
              onChange={e => mapState.updateStandaloneLabel(city.id, { fontColor: e.target.value })}
              className="w-6 h-5 border-0 bg-transparent cursor-pointer" />
          </label>
        </div>
        <button onClick={() => { mapState.removeStandaloneLabel(city.id); onClose(); }}
          className="mt-2 text-red-500 hover:text-red-700 cursor-pointer">Remove label</button>
      </div>
    );
  }

  const style = mapState.getCityStyle(city.id);

  // Parse current BG opacity % from rgba or default
  const bgColor = style.label.bgColor || 'rgba(255, 255, 255, 0.75)';
  const opacityMatch = bgColor.match(/[\d.]+\)$/);
  const currentOpacity = opacityMatch ? Math.round(parseFloat(opacityMatch[0]) * 100) : 75;

  const handleOpacityChange = (val) => {
    const pct = Math.max(0, Math.min(100, parseInt(val) || 0));
    mapState.setCityLabelStyle(city.id, { bgColor: `rgba(255, 255, 255, ${pct / 100})` });
  };

  return (
    <div
      className="absolute z-[2000] bg-white rounded shadow-lg border border-gray-200 p-3 text-xs"
      style={{ left, top, minWidth: 220 }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-700 truncate">{city.ijmes_cornuData || city.ijmes_name || city.name}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer ml-2">✕</button>
      </div>
      {city.nameAr && <div className="text-gray-500 mb-2" dir="rtl">{city.nameAr}</div>}

      {/* Node style */}
      <div className="text-gray-500 font-medium mb-1">Node</div>
      <div className="flex gap-2 flex-wrap mb-2">
        <label className="flex items-center gap-1 text-gray-600">
          <select value={style.node.shape}
            onChange={e => mapState.setCityNodeStyle(city.id, { shape: e.target.value })}
            className="border border-gray-200 rounded px-1 py-0.5">
            {SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1 text-gray-600">
          Size
          <input type="number" min="1" max="30" value={style.node.size}
            onChange={e => mapState.setCityNodeStyle(city.id, { size: parseInt(e.target.value) || 2 })}
            className="border border-gray-200 rounded px-1 py-0.5 w-10" />
        </label>
        <label className="flex items-center gap-1 text-gray-600">
          Fill
          <input type="color" value={style.node.fillColor}
            onChange={e => mapState.setCityNodeStyle(city.id, { fillColor: e.target.value })}
            className="w-6 h-5 border-0 bg-transparent cursor-pointer" />
        </label>
        <label className="flex items-center gap-1 text-gray-600">
          Border
          <input type="color" value={style.node.borderColor}
            onChange={e => mapState.setCityNodeStyle(city.id, { borderColor: e.target.value })}
            className="w-6 h-5 border-0 bg-transparent cursor-pointer" />
        </label>
      </div>

      {/* Label style */}
      <div className="text-gray-500 font-medium mb-1">Label</div>
      <input type="text" placeholder="Custom label..."
        value={style.label.customLabel || ''}
        onChange={e => mapState.setCityLabelStyle(city.id, { customLabel: e.target.value })}
        className="w-full border border-gray-200 rounded px-2 py-1 mb-1 text-gray-700" />
      <div className="flex gap-2 flex-wrap mb-1">
        <label className="flex items-center gap-1 text-gray-600">
          Pos
          <select value={style.label.position}
            onChange={e => mapState.setCityLabelStyle(city.id, { position: e.target.value })}
            className="border border-gray-200 rounded px-1 py-0.5">
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1 text-gray-600">
          Size
          <input type="number" min="8" max="24" value={style.label.fontSize}
            onChange={e => mapState.setCityLabelStyle(city.id, { fontSize: parseInt(e.target.value) || 12 })}
            className="border border-gray-200 rounded px-1 py-0.5 w-10" />
        </label>
        <label className="flex items-center gap-1 text-gray-600">
          Color
          <input type="color" value={style.label.fontColor}
            onChange={e => mapState.setCityLabelStyle(city.id, { fontColor: e.target.value })}
            className="w-6 h-5 border-0 bg-transparent cursor-pointer" />
        </label>
      </div>
      <div className="flex gap-3 mb-2">
        <label className="flex items-center gap-1 text-gray-600">
          <input type="checkbox" checked={style.label.showLabel}
            onChange={e => mapState.setCityLabelStyle(city.id, { showLabel: e.target.checked })} />
          Show
        </label>
        <label className="flex items-center gap-1 text-gray-600">
          <input type="checkbox" checked={style.label.bgBox}
            onChange={e => mapState.setCityLabelStyle(city.id, { bgBox: e.target.checked })} />
          BG box
        </label>
        {style.label.bgBox && (
          <label className="flex items-center gap-1 text-gray-600">
            Opacity %
            <input type="number" min="0" max="100" value={currentOpacity}
              onChange={e => handleOpacityChange(e.target.value)}
              className="border border-gray-200 rounded px-1 py-0.5 w-12" />
          </label>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={() => { mapState.removeCity(city.id); onClose(); }}
          className="text-red-500 hover:text-red-700 cursor-pointer">Remove</button>
        <span className="text-gray-400">Drag label to reposition</span>
      </div>
    </div>
  );
}

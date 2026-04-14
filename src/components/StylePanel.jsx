const SHAPES = ['circle', 'square', 'diamond', 'triangle'];
const POSITIONS = ['top', 'bottom', 'left', 'right'];

export default function StylePanel({ mapState }) {
  const ns = mapState.defaultNodeStyle;
  const ls = mapState.defaultLabelStyle;

  const updateNode = (k, v) => mapState.setDefaultNodeStyle(prev => ({ ...prev, [k]: v }));
  const updateLabel = (k, v) => mapState.setDefaultLabelStyle(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-3 text-xs">
      <div>
        <div className="text-gray-600 font-medium mb-1">Default Node Style</div>
        <div className="flex gap-2 flex-wrap">
          <label className="flex items-center gap-1 text-gray-700">
            Shape
            <select value={ns.shape} onChange={e => updateNode('shape', e.target.value)}
              className="bg-surface text-gray-700 rounded px-1 py-0.5 border border-sidebar-border">
              {SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1 text-gray-700">
            Size
            <input type="number" min="3" max="30" value={ns.size}
              onChange={e => updateNode('size', parseInt(e.target.value) || 8)}
              className="bg-surface text-gray-700 rounded px-1 py-0.5 border border-sidebar-border w-12" />
          </label>
          <label className="flex items-center gap-1 text-gray-700">
            Fill
            <input type="color" value={ns.fillColor} onChange={e => updateNode('fillColor', e.target.value)}
              className="w-6 h-5 border-0 bg-transparent cursor-pointer" />
          </label>
          <label className="flex items-center gap-1 text-gray-700">
            Border
            <input type="color" value={ns.borderColor} onChange={e => updateNode('borderColor', e.target.value)}
              className="w-6 h-5 border-0 bg-transparent cursor-pointer" />
          </label>
        </div>
      </div>

      <div>
        <div className="text-gray-600 font-medium mb-1">Default Label Style</div>
        <div className="flex gap-2 flex-wrap">
          <label className="flex items-center gap-1 text-gray-700">
            Position
            <select value={ls.position} onChange={e => updateLabel('position', e.target.value)}
              className="bg-surface text-gray-700 rounded px-1 py-0.5 border border-sidebar-border">
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1 text-gray-700">
            Size
            <input type="number" min="8" max="24" value={ls.fontSize}
              onChange={e => updateLabel('fontSize', parseInt(e.target.value) || 12)}
              className="bg-surface text-gray-700 rounded px-1 py-0.5 border border-sidebar-border w-12" />
          </label>
          <label className="flex items-center gap-1 text-gray-700">
            Color
            <input type="color" value={ls.fontColor} onChange={e => updateLabel('fontColor', e.target.value)}
              className="w-6 h-5 border-0 bg-transparent cursor-pointer" />
          </label>
        </div>
        <div className="flex gap-3 mt-1">
          <label className="flex items-center gap-1 text-gray-700">
            <input type="checkbox" checked={ls.showLabel}
              onChange={e => updateLabel('showLabel', e.target.checked)} />
            Show labels
          </label>
          <label className="flex items-center gap-1 text-gray-700">
            <input type="checkbox" checked={ls.bgBox}
              onChange={e => updateLabel('bgBox', e.target.checked)} />
            BG box
          </label>
        </div>
      </div>
    </div>
  );
}

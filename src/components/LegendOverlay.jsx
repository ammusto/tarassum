import { useRef, useCallback, useEffect } from 'react';

export default function LegendOverlay({ mapState }) {
  const ref = useRef(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e) => {
    dragging.current = true;
    const rect = ref.current.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragging.current || !ref.current) return;
      const parent = ref.current.parentElement.getBoundingClientRect();
      const x = e.clientX - parent.left - offset.current.x;
      const y = e.clientY - parent.top - offset.current.y;
      mapState.setLegendPosition({ x, y });
    };
    const onMouseUp = () => { dragging.current = false; };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [mapState.setLegendPosition]);

  const { legendEntries, legendPosition } = mapState;

  return (
    <div
      ref={ref}
      className="legend-overlay"
      style={{ left: legendPosition.x, top: legendPosition.y }}
      onMouseDown={onMouseDown}
    >
      {legendEntries.map(entry => (
        <div key={entry.id} className="flex items-center gap-2 py-0.5">
          {entry.type === 'node' ? (
            <svg width="12" height="12">
              {entry.shape === 'square' ?
                <rect x="1" y="1" width="10" height="10" fill={entry.color} /> :
              entry.shape === 'diamond' ?
                <polygon points="6,0 12,6 6,12 0,6" fill={entry.color} /> :
              entry.shape === 'triangle' ?
                <polygon points="6,0 12,12 0,12" fill={entry.color} /> :
                <circle cx="6" cy="6" r="5" fill={entry.color} />
              }
            </svg>
          ) : (
            <svg width="18" height="12">
              <line x1="0" y1="6" x2="18" y2="6" stroke={entry.color} strokeWidth="2"
                strokeDasharray={entry.dashStyle === 'dashed' ? '4 3' : entry.dashStyle === 'dotted' ? '1 3' : 'none'} />
            </svg>
          )}
          <span className="text-xs text-gray-800">{entry.label}</span>
        </div>
      ))}
    </div>
  );
}

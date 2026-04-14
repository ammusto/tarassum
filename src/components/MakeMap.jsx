import { useState, useEffect, useRef } from 'react';
import { loadData } from '../data/loader.js';
import { useMapState } from '../hooks/useMapState.js';
import { decodeState } from '../utils/shareUrl.js';
import Sidebar from './Sidebar.jsx';
import MapView from './MapView.jsx';

export default function MakeMap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );
  const mapState = useMapState();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const sharedHashConsumed = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    loadData().then(d => { setData(d); setLoading(false); });
  }, [isMobile]);

  useEffect(() => {
    if (!data || sharedHashConsumed.current) return;
    const hash = window.location.hash;
    const match = hash.match(/^#m=(.+)$/);
    if (!match) return;
    sharedHashConsumed.current = true;
    try {
      const state = decodeState(match[1], data.places);
      mapState.applyState(state, data.places);
    } catch (err) {
      console.error('Could not load shared map:', err);
    }
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [data, mapState]);

  if (isMobile) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-black px-6">
        <div className="max-w-sm text-center">
          <div className="text-2xl font-light mb-3">Tarassum</div>
          <div className="text-sm text-gray-700 mb-4">
            Make a Map is not designed for mobile devices. Please open this page on a desktop or tablet to build custom maps.
          </div>
          <a href="/" className="text-sm font-bold underline text-black">Back to Home</a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white text-black">
        <div className="text-center">
          <div className="text-2xl font-light mb-2">Tarassum</div>
          <div className="text-sm text-gray-500">Loading gazetteer data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${mapState.placementMode ? 'placement-mode' : ''}`}>
      {mapState.sidebarOpen && (
        <Sidebar data={data} mapState={mapState} mapContainerRef={mapContainerRef} mapInstanceRef={mapInstanceRef} />
      )}
      <div className="flex-1 relative" ref={mapContainerRef}>
        <MapView data={data} mapState={mapState} mapInstanceRef={mapInstanceRef} />
        {/* Sidebar toggle */}
        <button
          onClick={() => mapState.setSidebarOpen(v => !v)}
          className="absolute bottom-6 left-3 z-[1000] bg-white border border-gray-300 rounded px-2 py-1 text-sm shadow hover:bg-gray-50 cursor-pointer"
          title={mapState.sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          {mapState.sidebarOpen ? '◀' : '▶'} Panel
        </button>
      </div>
    </div>
  );
}

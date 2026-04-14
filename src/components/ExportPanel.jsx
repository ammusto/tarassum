import { useState, useRef } from 'react';
import { exportPNG, exportPDF } from '../utils/exportMap.js';
import { buildShareUrl } from '../utils/shareUrl.js';
import { buildGeoJSON } from '../utils/geojsonExport.js';

const SHARE_URL_WARN = 6000;

export default function ExportPanel({ data, mapState, mapContainerRef, mapInstanceRef }) {
  const fileInputRef = useRef(null);
  const [shareStatus, setShareStatus] = useState(null);
  const [format, setFormat] = useState('png');
  const [dpi, setDpi] = useState(300);
  const [pageSize, setPageSize] = useState('viewport');
  const [filename, setFilename] = useState('tarassum-map');
  const [exporting, setExporting] = useState(false);

  const flashStatus = (kind, text) => {
    setShareStatus({ kind, text });
    setTimeout(() => setShareStatus(null), 3500);
  };

  const handleCopyShareLink = async () => {
    try {
      const url = buildShareUrl(mapState.getCurrentState(), data?.places);
      await navigator.clipboard.writeText(url);
      const tooLong = url.length > SHARE_URL_WARN;
      flashStatus(
        tooLong ? 'warn' : 'ok',
        tooLong
          ? `Copied (${url.length} chars: long URLs may break in chat apps)`
          : 'Link copied'
      );
    } catch (err) {
      console.error('Share link failed:', err);
      flashStatus('err', 'Could not copy link');
    }
  };

  const handleExportGeoJSON = () => {
    const fc = buildGeoJSON(data, mapState);
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename || 'tarassum-map'}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportData = () => {
    const payload = {
      format: 'tarassum-map',
      version: 1,
      exportedAt: new Date().toISOString(),
      state: mapState.getCurrentState(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename || 'tarassum-map'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadData = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !data) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const state = parsed.state || parsed;
      if (!state || typeof state !== 'object') throw new Error('Invalid file');
      mapState.applyState(state, data.places);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Could not load map data: ' + err.message);
    }
  };

  const handleExport = async () => {
    // Use the Leaflet map's own container (has tile panes, overlays, etc.)
    const map = mapInstanceRef?.current;
    const container = map ? map.getContainer() : mapContainerRef.current;
    if (!container) return;
    setExporting(true);

    try {
      let blob;
      let ext;

      if (format === 'png') {
        blob = await exportPNG(container, dpi);
        ext = 'png';
      } else {
        blob = await exportPDF(container, dpi, pageSize);
        ext = 'pdf';
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-2 text-xs">
      <div className="text-gray-700 font-semibold uppercase tracking-wide text-[10px]">Image</div>
      <div>
        <div className="text-gray-600 font-medium mb-1">Format</div>
        <div className="flex gap-2">
          {['png', 'pdf'].map(f => (
            <label key={f} className="flex items-center gap-1 text-gray-700 cursor-pointer">
              <input type="radio" name="exportFormat" value={f}
                checked={format === f} onChange={() => setFormat(f)} className="w-3 h-3" />
              {f.toUpperCase()}
            </label>
          ))}
        </div>
      </div>

      {format === 'png' && (
        <label className="flex items-center gap-2 text-gray-700">
          DPI
          <select value={dpi} onChange={e => setDpi(parseInt(e.target.value))}
            className="bg-surface text-gray-700 rounded px-2 py-1 border border-sidebar-border">
            <option value={150}>150</option>
            <option value={300}>300</option>
          </select>
        </label>
      )}

      {format === 'pdf' && (
        <label className="flex items-center gap-2 text-gray-700">
          Page size
          <select value={pageSize} onChange={e => setPageSize(e.target.value)}
            className="bg-surface text-gray-700 rounded px-2 py-1 border border-sidebar-border">
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
            <option value="viewport">Match viewport</option>
          </select>
        </label>
      )}

      <label className="flex items-center gap-2 text-gray-700">
        Filename
        <input type="text" value={filename} onChange={e => setFilename(e.target.value)}
          className="flex-1 bg-surface text-gray-700 rounded px-2 py-1 border border-sidebar-border" />
      </label>

      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full bg-accent text-white rounded py-2 font-medium hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
      >
        {exporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
      </button>

      <div className="pt-3 mt-3 border-t border-sidebar-border space-y-2">
        <div className="text-gray-700 font-semibold uppercase tracking-wide text-[10px]">Map Data</div>
        <button
          onClick={handleExportData}
          className="w-full bg-surface text-gray-700 rounded py-1.5 border border-sidebar-border hover:border-accent cursor-pointer"
        >
          Export Map Data (.json)
        </button>
        <button
          onClick={handleExportGeoJSON}
          className="w-full bg-surface text-gray-700 rounded py-1.5 border border-sidebar-border hover:border-accent cursor-pointer"
        >
          Export as GeoJSON
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-surface text-gray-700 rounded py-1.5 border border-sidebar-border hover:border-accent cursor-pointer"
        >
          Upload Map Data
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleUploadData}
          className="hidden"
        />
        <button
          onClick={handleCopyShareLink}
          className="w-full bg-surface text-gray-700 rounded py-1.5 border border-sidebar-border hover:border-accent cursor-pointer"
        >
          Copy Share Link
        </button>
        {shareStatus && (
          <div className={
            shareStatus.kind === 'ok' ? 'text-green-600' :
            shareStatus.kind === 'warn' ? 'text-amber-600' : 'text-red-600'
          }>
            {shareStatus.text}
          </div>
        )}
      </div>
    </div>
  );
}

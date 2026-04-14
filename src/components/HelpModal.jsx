export default function HelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto p-6 text-sm text-gray-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tarassum: Make a Map Help</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-black text-xl cursor-pointer">&times;</button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">Search & Add</h3>
            <p>Search the gazetteer by transliterated or Arabic name. Filter results by place type (metropoles, capitals, towns, waystations, villages, etc.) or by region. Click a result to add it to your map.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Custom Cities & Labels</h3>
            <p>Click "+ Custom City" or "+ Add Label" in the sidebar and then click anywhere on the map to drop a marker or a free-floating text label. Custom cities can be dragged to reposition and edited just like gazetteer cities.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Node Styling</h3>
            <p>Click any city node or its label on the map to open the style editor. Change the marker shape (circle, square, diamond, triangle), size, fill color, and border color on a per-city basis.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Label Styling</h3>
            <p>In the style editor, toggle labels on/off, set custom label text, adjust font size and color, and choose label position (top, bottom, left, right). Enable the background box for a translucent backdrop with adjustable opacity. Drag any label to reposition it — the pixel offset is preserved across zoom levels.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Routes</h3>
            <p>Two routing modes are available:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li><strong>All Pairwise</strong>: computes the shortest historical route between every pair of selected cities using Dijkstra's algorithm on the medieval route network.</li>
              <li><strong>Shortest Network</strong>: finds the minimum spanning tree connecting all selected cities with the least total route distance, avoiding redundant paths.</li>
            </ul>
            <p className="mt-1">Route color, width, and dash style (solid, dashed, dotted, dash-dot) are customizable per route.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Default Styles</h3>
            <p>Set default node, label, and route styles that will apply to any newly added cities and routes.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Base Layers & Display</h3>
            <p>Choose between terrain, grayscale terrain, landmass-only (with customizable land, water, and border colors), satellite imagery, and shaded relief. Toggle modern political borders on or off as an overlay.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Legend</h3>
            <p>Add a legend overlay to your map. Auto-generate entries from your current map styles or manually add node and line entries with custom labels, shapes, and colors. The legend box itself is draggable on the map.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Export: Image</h3>
            <p>Export the current map as PNG (at 150 or 300 DPI) or PDF (A4, Letter, or match viewport size).</p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Export: Map Data</h3>
            <p>Export the full map state as a JSON file, upload a previously exported JSON to restore it, or copy a share link that encodes the entire map in the URL hash. Paste the link into another browser to open that exact map. Gazetteer city IDs are packed into a compact base62 code, so typical maps produce short, chat-friendly URLs.</p>
            <p className="mt-1">You can also export to <strong>GeoJSON</strong> (RFC 7946) for use in QGIS, kepler.gl, Mapbox, or any other GIS tool. Selected and custom cities become Point features, standalone labels become labeled Points, and routes become LineString features with their style properties attached. Coordinates use [longitude, latitude] order at the source gazetteer's precision.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-1">Save / Load</h3>
            <p>Save named map configurations to your browser's local storage and reload them later to continue editing. The Clear Local Data button wipes all saved maps at once (click twice to confirm).</p>
          </div>
        </div>
      </div>
    </div>
  );
}

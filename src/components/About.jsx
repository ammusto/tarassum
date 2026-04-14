export default function About() {
  return (
    <div className="max-w-[800px] mx-auto">
      <h2>About</h2>
      <p>
        Tarassum is built on data from the <a href="https://github.com/althurayya/althurayya.github.io/" target="_blank" rel="noopener noreferrer">al-Thurayyā project</a>,
        which provides a geospatial model of the early Islamic world based on Georgette
        Cornu's <em>Atlas du monde arabo-islamique à l'époque classique</em>. The dataset
        includes over 2,500 locations: cities, towns, waystations, villages, and waterways 
        along with the historical route network connecting them.
      </p>

      <h2>View Map</h2>
      <p>
        The "View Map" mode displays the full gazetteer for all cities, towns, waystations, and
        water features for browsing. Locations are revealed progressively as you zoom in:
        metropoles and capitals are always visible, towns appear at moderate zoom, and villages,
        waystations, and sites appear at closer zoom levels. Labels follow a similar tiered
        visibility. Multiple base layers are available, including terrain, grayscale terrain,
        landmass-only, and satellite imagery, with an optional modern-borders overlay.
      </p>
      <p>
        Enable <strong>Show Regions</strong> from the Map Settings panel to color all nodes and
        routes by the historical region each city belongs to. A collapsible regions key on the
        right lists every populated region — click any entry to fly the map to that region's
        bounds. Clicking a city or its label opens a popup with its name in Latin and Arabic
        script, type, and region.
      </p>

      <h2>Make Map</h2>
      <p>
        The "Make Map" mode is a full-screen map editor for creating custom maps of the
        Islamic world. Features include:
      </p>
      <ul>
        <li><strong>City search and selection</strong>: Search the gazetteer by name (transliterated or Arabic) and add cities to your map. Filter by type (metropoles, capitals, towns, waystations, villages, etc.) or by region.</li>
        <li><strong>Custom cities and labels</strong>: Place custom city markers or free-floating text labels anywhere on the map by clicking. Custom cities can be dragged to reposition and styled like gazetteer cities.</li>
        <li><strong>Node styling</strong>: Customize each city's marker shape (circle, square, diamond, triangle), size, fill color, and border color. Click any node or its label to open the style editor.</li>
        <li><strong>Label styling</strong>: Toggle labels on/off, set custom label text, adjust font size and color, choose label position (top, bottom, left, right), and add a translucent background box with adjustable opacity. Labels can be dragged to reposition and will maintain their pixel offset across zoom levels.</li>
        <li><strong>Route display</strong>: Two routing modes are available. "All Pairwise" computes the shortest historical route between every pair of selected cities using Dijkstra's algorithm. "Shortest Network" finds the minimum spanning tree connecting all selected cities with the least total route distance. Route color, width, and dash style (solid, dashed, dotted, dash-dot) are customizable per route.</li>
        <li><strong>Default styles</strong>: Set default node, label, and route styles that apply to newly added cities and routes.</li>
        <li><strong>Multiple base layers</strong>: Choose between terrain, grayscale terrain, landmass-only (with customizable land, water, and border colors), satellite imagery, and shaded relief. Toggle modern political borders on or off as an overlay.</li>
        <li><strong>Legend</strong>: Add a draggable legend overlay with node and line entries. Auto-generate entries from the current map styles or build manually.</li>
        <li><strong>Image export</strong>: Export the current map as PNG (at 150 or 300 DPI) or PDF (A4, Letter, or match viewport).</li>
        <li><strong>Map data export & share link</strong>: Export the full map state as a JSON file, upload a previously exported JSON to restore it, or copy a share link that encodes the entire map in the URL hash — paste the link into another browser to open the exact same map.</li>
        <li><strong>GeoJSON export</strong>: Export your cities, standalone labels, and computed routes as a valid GeoJSON FeatureCollection (RFC 7946) for use in QGIS, kepler.gl, Mapbox, or any other GIS tool.</li>
        <li><strong>Save and load</strong>: Save named map configurations to your browser's local storage and reload them later. A Clear Local Data button wipes all saved maps at once.</li>
      </ul>

      <h2>Citation</h2>
      <p>
        The underlying data should be cited as:
      </p>
      <blockquote>
        Seydi, Masoumeh, and Maxim Romanov. <em>al-Ṯurayyā Project</em>: a gazetteer and a
        geospatial model of the early Islamic World. (Based on: Georgette Cornu's <em>Atlas
        du monde arabo-islamique à l'époque classique: IXe-Xe siècles</em>, Leiden: Brill,
        1983). <a href="https://althurayya.github.io/" target="_blank" rel="noopener noreferrer">https://althurayya.github.io/</a>, 2022—.
      </blockquote>

      <h2>Source Code</h2>
      <p>
        Tarassum is open source. You can view the source code, report issues, or contribute
        on <a href="https://github.com/ammusto/tarassum" target="_blank" rel="noopener noreferrer">GitHub</a>.
      </p>
    </div>
  );
}

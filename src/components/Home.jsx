import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="max-w-[800px] mx-auto">
      <p>
        Tarassum is a tool for exploring and creating maps of the early Islamic world,
        based on gazetteer data from the <a href="https://github.com/althurayya/althurayya.github.io/" target="_blank" rel="noopener noreferrer">al-Thurayyā project</a>. Browse the full network
        of cities, towns, waystations, and the routes connecting them. Or create your
        own custom maps (Experimental) with styled nodes, labels, and routes that you can export.</p><p> <strong>Note:</strong> Make a map functionality is not currently available on mobile, but can be tested on desktop or tablet.
      </p>
      <ul>
        <li><Link to="/view" className="font-bold underline">View Map</Link>: Browse the full gazetteer with all locations and routes. You can toggle to show water features, modern borders, medieval regions, and more.</li>
        <li><Link to="/make" className="font-bold underline">Make Map (Experimental)</Link>: Create a custom map with your own selection of cities and routes</li>
      </ul>
    </div>
  );
}

import { useState } from 'react';
import SearchPanel from './SearchPanel.jsx';
import CityList from './CityList.jsx';
import RoutePanel from './RoutePanel.jsx';
import StylePanel from './StylePanel.jsx';
import LegendPanel from './LegendPanel.jsx';
import ExportPanel from './ExportPanel.jsx';
import SaveLoadPanel from './SaveLoadPanel.jsx';
import HelpModal from './HelpModal.jsx';

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-sidebar-border">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-sidebar-hover cursor-pointer"
      >
        <span>{title}</span>
        <span className="text-xs text-gray-400">{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

export default function Sidebar({ data, mapState, mapContainerRef, mapInstanceRef }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="w-[340px] min-w-[340px] bg-sidebar text-gray-800 flex flex-col h-full border-r border-sidebar-border">
      <div className="px-4 py-3 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-black tracking-wide">Tarassum <span className="text-sm font-normal text-gray-500">(Make a Map)</span></h1>
            <a href="/" className="text-xs text-gray-500 hover:text-black">(Back to Home Page)</a>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className="text-2xl text-gray-400 hover:text-black cursor-pointer leading-none"
            title="Help"
          >?</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto sidebar-scroll">
        <Section title="Search & Add">
          <SearchPanel data={data} mapState={mapState} />
        </Section>
        <Section title="Selected Cities" defaultOpen={true}>
          <CityList data={data} mapState={mapState} />
        </Section>
        <Section title="Routes" defaultOpen={false}>
          <RoutePanel data={data} mapState={mapState} />
        </Section>
        <Section title="Default Styles" defaultOpen={false}>
          <StylePanel mapState={mapState} />
        </Section>
        <Section title="Legend" defaultOpen={false}>
          <LegendPanel mapState={mapState} />
        </Section>
      </div>
      <div className="border-t-4 border-sidebar-border max-h-[50vh] overflow-y-auto sidebar-scroll bg-sidebar">
        <div className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
          Data & Files
        </div>
        <Section title="Export" defaultOpen={false}>
          <ExportPanel data={data} mapState={mapState} mapContainerRef={mapContainerRef} mapInstanceRef={mapInstanceRef} />
        </Section>
        <Section title="Save / Load" defaultOpen={false}>
          <SaveLoadPanel data={data} mapState={mapState} />
        </Section>
      </div>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

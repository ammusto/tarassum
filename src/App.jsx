import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './components/Home.jsx';

const About = lazy(() => import('./components/About.jsx'));
const ViewMap = lazy(() => import('./components/ViewMap.jsx'));
const MakeMap = lazy(() => import('./components/MakeMap.jsx'));

export default function App() {
  return (
    <Router>
      <Suspense fallback={null}>
        <Routes>
          {/* Make Map is full-screen, no header/footer */}
          <Route path="/make" element={<MakeMap />} />

          {/* All other pages get header + footer layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/view" element={<ViewMap />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

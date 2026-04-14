import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function Layout() {
  const location = useLocation();
  const isViewMap = location.pathname === '/view';
  return (
    <div className={isViewMap ? 'layout-flex layout-fullheight' : 'layout-flex'}>
      <Header />
      {isViewMap ? (
        <div className="main-fullheight">
          <Outlet />
        </div>
      ) : (
        <div className="container">
          <div className="main">
            <Outlet />
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

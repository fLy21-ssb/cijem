import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = () => (
  <div className="app-layout">
    <Sidebar />
    <main className="main-area">
      <Topbar />
      <div className="content-wrapper">
        <Outlet />
      </div>
    </main>
  </div>
);

export default Layout;

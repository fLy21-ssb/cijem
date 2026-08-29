import { Outlet } from 'react-router-dom';
import ExpedienteTabs from './ExpedienteTabs';
import Cabecera from './Cabecera';

const Layout = () => (
  <div className="expediente-shell">
    <ExpedienteTabs />
    <div className="expediente-page">
      <Cabecera />
      <div className="expediente-body">
        <Outlet />
      </div>
    </div>
  </div>
);

export default Layout;

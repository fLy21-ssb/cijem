import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, Target, FileBarChart, Settings, ClipboardList, Users } from 'lucide-react';
import logoJunji from '../assets/junji.png';
import { useAuth } from '../context/useAuth';

const Sidebar = () => {
  const { esAdministrador } = useAuth();

  const menuItems = [
    { nombre: 'Inicio', ruta: '/', icono: <LayoutDashboard size={20} /> },
    { nombre: 'Cargar Datos', ruta: '/cargar-datos', icono: <UploadCloud size={20} /> },
    { nombre: 'Metas', ruta: '/metas', icono: <Target size={20} /> },
    { nombre: 'Auditoría', ruta: '/auditoria', icono: <ClipboardList size={20} /> },
    { nombre: 'Reportes', ruta: '/reportes', icono: <FileBarChart size={20} /> },
    ...(esAdministrador ? [{ nombre: 'Usuarios', ruta: '/usuarios', icono: <Users size={20} /> }] : []),
    { nombre: 'Configuración', ruta: '/configuracion', icono: <Settings size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logoJunji} alt="Logo JUNJI" />
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.nombre}
            to={item.ruta}
            end={item.ruta === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icono}
            <span>{item.nombre}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

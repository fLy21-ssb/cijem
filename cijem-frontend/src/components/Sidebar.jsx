import { LayoutDashboard, UploadCloud, Target, FileBarChart, Settings } from 'lucide-react';
import logoJunji from '../assets/junji.png';

const Sidebar = ({ vistaActiva, setVistaActiva }) => {
  const menuItems = [
    { nombre: 'Inicio', icono: <LayoutDashboard size={20} /> },
    { nombre: 'Cargar Datos', icono: <UploadCloud size={20} /> },
    { nombre: 'Metas', icono: <Target size={20} /> },
    { nombre: 'Reportes', icono: <FileBarChart size={20} /> },
    { nombre: 'Configuración', icono: <Settings size={20} /> }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logoJunji} alt="Logo JUNJI" />
      </div>
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.nombre}
            className={`nav-item ${vistaActiva === item.nombre ? 'active' : ''}`}
            onClick={() => setVistaActiva(item.nombre)}
          >
            {item.icono}
            <span>{item.nombre}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
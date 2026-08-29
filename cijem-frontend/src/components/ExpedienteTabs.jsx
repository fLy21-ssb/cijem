import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import logoJunji from '../assets/junji.png';

const SECCIONES = [
  { nombre: 'Inicio', ruta: '/' },
  { nombre: 'Cargar Datos', ruta: '/cargar-datos' },
  { nombre: 'Metas', ruta: '/metas' },
  { nombre: 'Auditoría', ruta: '/auditoria' },
  { nombre: 'Reportes', ruta: '/reportes' },
];

const ExpedienteTabs = () => {
  const { esAdministrador } = useAuth();
  const secciones = [
    ...SECCIONES,
    ...(esAdministrador ? [{ nombre: 'Usuarios', ruta: '/usuarios' }] : []),
    { nombre: 'Config.', ruta: '/configuracion' },
  ];

  return (
    <div className="expediente-tabstrip">
      <div className="expediente-brand">
        <img src={logoJunji} alt="Logo JUNJI" />
        <span>CIJEM</span>
      </div>
      <nav className="tabs">
        {secciones.map((s) => (
          <NavLink
            key={s.nombre}
            to={s.ruta}
            end={s.ruta === '/'}
            className={({ isActive }) => `folder-tab ${isActive ? 'active' : ''}`}
          >
            {s.nombre}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default ExpedienteTabs;

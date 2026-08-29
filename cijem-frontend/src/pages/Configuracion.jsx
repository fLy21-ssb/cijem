import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const Configuracion = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <h2 className="page-title">Configuración</h2>
      <div className="card" style={{ maxWidth: 480 }}>
        <h3 style={{ borderBottom: '1px solid var(--linea)', paddingBottom: 12 }}>
          Perfil de Usuario
        </h3>
        <div className="detalle-grid">
          <div className="detalle-item"><span>Nombre</span><strong>{usuario?.nombre}</strong></div>
          <div className="detalle-item"><span>RUT</span><strong>{usuario?.rut}</strong></div>
          <div className="detalle-item"><span>Rol</span><strong>{usuario?.rol}</strong></div>
        </div>
        <button className="btn-secondary" style={{ marginTop: 24 }} onClick={handleLogout}>Cerrar Sesión</button>
      </div>
    </>
  );
};

export default Configuracion;

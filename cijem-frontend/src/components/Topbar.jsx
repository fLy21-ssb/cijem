import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { api } from '../api/client';

function iniciales(nombre = '') {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('') || '??';
}

const Topbar = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [notificaciones, setNotificaciones] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    let activo = true;
    api
      .resumenDashboard()
      .then((data) => {
        if (activo) setNotificaciones(data.data.notificaciones || []);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const cerrarSiClickAfuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrarSiClickAfuera);
    return () => document.removeEventListener('mousedown', cerrarSiClickAfuera);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <h2 className="topbar-title">CIJEM</h2>
      <div className="topbar-actions">
        <div className="notif-wrapper" ref={contenedorRef}>
          <button className="icon-button" onClick={() => setAbierto((v) => !v)} aria-label="Notificaciones">
            <Bell size={20} />
            {notificaciones.length > 0 && <span className="notif-badge">{notificaciones.length}</span>}
          </button>
          {abierto && (
            <div className="notif-dropdown">
              <div className="notif-dropdown-header">Alertas críticas</div>
              {notificaciones.length === 0 ? (
                <div className="notif-empty">No hay indicadores en estado crítico.</div>
              ) : (
                notificaciones.map((n) => (
                  <div key={n.id} className="notif-item">
                    {n.mensaje}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="user-profile">
          <div className="avatar">{iniciales(usuario?.nombre)}</div>
          <div className="user-info">
            <span className="user-name">{usuario?.nombre || 'Usuario'}</span>
            <span className="user-role">{usuario?.rol}</span>
          </div>
          <button className="icon-button" onClick={handleLogout} aria-label="Cerrar sesión" title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;

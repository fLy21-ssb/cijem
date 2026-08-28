import { useEffect, useState } from 'react';
import { api } from '../api/client';
import EmptyState from '../components/EmptyState';

const FORM_VACIO = { rut: '', nombre: '', password: '', rol: 'Gestor' };

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(FORM_VACIO);
  const [creando, setCreando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [mensajeOk, setMensajeOk] = useState('');

  const cargarUsuarios = () => {
    api.listarUsuarios().then((data) => setUsuarios(data.data)).catch((err) => setError(err.message)).finally(() => setCargando(false));
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    setCreando(true);
    setErrorForm('');
    setMensajeOk('');
    try {
      await api.crearUsuario(form);
      setForm(FORM_VACIO);
      setMensajeOk('Usuario creado correctamente.');
      cargarUsuarios();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setCreando(false);
    }
  };

  return (
    <>
      <h2 className="page-title">Gestión de Usuarios</h2>

      <div className="card" style={{ maxWidth: 560, marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, color: '#1A3668', marginBottom: 16 }}>Nuevo Usuario</h3>
        <form onSubmit={handleCrear}>
          <div className="form-row">
            <div className="form-group">
              <label>RUT</label>
              <input type="text" className="form-control" value={form.rut} onChange={(e) => setForm({ ...form, rut: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Nombre completo</label>
              <input type="text" className="form-control" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password" className="form-control" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} required
              />
            </div>
            <div className="form-group">
              <label>Rol</label>
              <select className="form-control" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                <option value="Gestor">Gestor</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
          </div>
          {errorForm && <p className="status-msg err">{errorForm}</p>}
          {mensajeOk && <p className="status-msg ok">{mensajeOk}</p>}
          <button type="submit" className="btn-primary" disabled={creando} style={{ marginTop: 8 }}>
            {creando ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, color: '#1A3668', marginBottom: 16 }}>Usuarios del Sistema</h3>
        {cargando ? (
          <p>Cargando usuarios...</p>
        ) : error ? (
          <p className="status-msg err">{error}</p>
        ) : usuarios.length === 0 ? (
          <EmptyState titulo="No hay usuarios registrados" />
        ) : (
          <table className="data-table">
            <thead><tr><th>RUT</th><th>Nombre</th><th>Rol</th><th>Creado</th></tr></thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>{u.rut}</td>
                  <td>{u.nombre}</td>
                  <td>{u.rol}</td>
                  <td>{new Date(u.creado_en).toLocaleDateString('es-CL')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default Usuarios;

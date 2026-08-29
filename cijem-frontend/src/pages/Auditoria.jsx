import { useEffect, useState } from 'react';
import { api } from '../api/client';
import EmptyState from '../components/EmptyState';

const ACCIONES = ['CREAR', 'EDITAR', 'ELIMINAR', 'CARGA_MASIVA'];

const Auditoria = () => {
  const [registros, setRegistros] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = (accion) => {
    api
      .listarAuditoria(accion)
      .then((data) => setRegistros(data.data))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(filtro); }, [filtro]);

  return (
    <>
      <h2 className="page-title">Auditoría y Trazabilidad</h2>
      <div className="card">
        <div className="table-toolbar">
          <div className="filters-row">
            <select className="select-control" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option value="">Todas las acciones</option>
              {ACCIONES.map((a) => <option key={a} value={a}>{a.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>

        {cargando ? (
          <p>Cargando historial...</p>
        ) : error ? (
          <p className="status-msg err">{error}</p>
        ) : registros.length === 0 ? (
          <EmptyState titulo="Sin registros de auditoría" descripcion="Aún no se han realizado acciones que dejen huella." />
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Tabla</th><th>Registro</th><th>Detalle</th></tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.fecha).toLocaleString('es-CL')}</td>
                  <td>{r.usuario_nombre}</td>
                  <td>{r.accion.replace('_', ' ')}</td>
                  <td>{r.tabla_afectada}</td>
                  <td>{r.registro_id ?? '-'}</td>
                  <td style={{ maxWidth: 360, fontSize: 12, color: '#8A93A6', fontFamily: 'Public Sans, sans-serif' }}>
                    {typeof r.detalle === 'string' ? r.detalle : JSON.stringify(r.detalle)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default Auditoria;

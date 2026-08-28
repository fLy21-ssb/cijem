import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/useAuth';
import EstadoBadge from '../components/EstadoBadge';
import EmptyState from '../components/EmptyState';

const FORM_VACIO = {
  id: null,
  codigo_interno: '',
  nombre: '',
  descripcion: '',
  meta_anual: '',
  unidad_medida: '',
  frecuencia_medicion: '',
  fecha_inicio: '2026-01-01',
  fecha_termino: '2026-12-31',
};

const Metas = () => {
  const { esAdministrador } = useAuth();
  const [indicadores, setIndicadores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFrecuencia, setFiltroFrecuencia] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [metaForm, setMetaForm] = useState(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const [detalle, setDetalle] = useState(null);

  const cargarDatos = () => {
    api
      .listarIndicadores()
      .then((data) => setIndicadores(data.data))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargarDatos(); }, []);

  const indicadoresFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return indicadores.filter((ind) => {
      const coincideTexto =
        !texto || ind.nombre.toLowerCase().includes(texto) || ind.codigo_interno.toLowerCase().includes(texto);
      const coincideEstado = !filtroEstado || ind.estado === filtroEstado;
      const coincideFrecuencia = !filtroFrecuencia || ind.frecuencia_medicion === filtroFrecuencia;
      return coincideTexto && coincideEstado && coincideFrecuencia;
    });
  }, [indicadores, busqueda, filtroEstado, filtroFrecuencia]);

  const abrirModalCreacion = () => {
    setMetaForm(FORM_VACIO);
    setErrorModal('');
    setModalAbierto(true);
  };

  const abrirModalEdicion = (ind) => {
    setMetaForm({
      id: ind.id,
      codigo_interno: ind.codigo_interno,
      nombre: ind.nombre,
      descripcion: ind.descripcion || '',
      meta_anual: ind.meta_anual,
      unidad_medida: ind.unidad_medida || '',
      frecuencia_medicion: ind.frecuencia_medicion,
      fecha_inicio: ind.fecha_inicio?.slice(0, 10) || '2026-01-01',
      fecha_termino: ind.fecha_termino?.slice(0, 10) || '2026-12-31',
    });
    setErrorModal('');
    setModalAbierto(true);
  };

  const handleGuardarMeta = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorModal('');
    try {
      if (metaForm.id) {
        await api.editarIndicador(metaForm.id, metaForm);
      } else {
        await api.crearIndicador(metaForm);
      }
      setModalAbierto(false);
      cargarDatos();
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarMeta = async (ind) => {
    if (!window.confirm(`¿Confirma la eliminación permanente de "${ind.nombre}"?`)) return;
    try {
      await api.eliminarIndicador(ind.id);
      cargarDatos();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <h2 className="page-title">Módulo Administrativo de Indicadores</h2>

      <div className="card">
        <div className="table-toolbar">
          <div className="filters-row">
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <select className="select-control" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="Verde">Normal</option>
              <option value="Amarillo">Alerta</option>
              <option value="Rojo">Crítico</option>
            </select>
            <select className="select-control" value={filtroFrecuencia} onChange={(e) => setFiltroFrecuencia(e.target.value)}>
              <option value="">Toda frecuencia</option>
              <option value="Mensual">Mensual</option>
              <option value="Trimestral">Trimestral</option>
              <option value="Anual">Anual</option>
            </select>
          </div>
          <button className="btn-primary" onClick={abrirModalCreacion}>Nueva Meta</button>
        </div>

        {cargando ? (
          <p>Cargando indicadores...</p>
        ) : error ? (
          <p className="status-msg err">{error}</p>
        ) : indicadores.length === 0 ? (
          <EmptyState titulo="Aún no hay metas registradas" descripcion="Cree la primera meta con el botón 'Nueva Meta'." />
        ) : indicadoresFiltrados.length === 0 ? (
          <EmptyState titulo="Sin resultados" descripcion="Ningún indicador coincide con los filtros aplicados." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Código</th><th>Nombre</th><th>Meta</th><th>Avance</th><th>Estado</th><th style={{ textAlign: 'right' }}>Gestión</th>
              </tr>
            </thead>
            <tbody>
              {indicadoresFiltrados.map((ind) => (
                <tr key={ind.id}>
                  <td><strong>{ind.codigo_interno}</strong></td>
                  <td>
                    {ind.nombre}
                    <div className="progress-track" style={{ maxWidth: 160 }}>
                      <div
                        className={`progress-fill badge-${ind.estado === 'Verde' ? 'normal' : ind.estado === 'Amarillo' ? 'alerta' : 'critico'}`}
                        style={{ width: `${Math.min(100, ind.porcentaje_cumplimiento)}%` }}
                      />
                    </div>
                  </td>
                  <td>{ind.meta_anual} {ind.unidad_medida}</td>
                  <td>{ind.porcentaje_cumplimiento}%</td>
                  <td><EstadoBadge estado={ind.estado} label={ind.estado_label} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn-link" onClick={() => setDetalle(ind)}>Ver</button>
                      <button className="btn-link" onClick={() => abrirModalEdicion(ind)}>Editar</button>
                      {esAdministrador && (
                        <button className="btn-link danger" onClick={() => handleEliminarMeta(ind)}>Eliminar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{metaForm.id ? 'Modificar Indicador' : 'Nuevo Indicador'}</h3>
              <button className="btn-close" onClick={() => setModalAbierto(false)}>×</button>
            </div>
            <form onSubmit={handleGuardarMeta}>
              <div className="form-group">
                <label>Código interno</label>
                <input
                  type="text" className="form-control" value={metaForm.codigo_interno}
                  onChange={(e) => setMetaForm({ ...metaForm, codigo_interno: e.target.value })}
                  disabled={!!metaForm.id} required
                />
              </div>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text" className="form-control" value={metaForm.nombre}
                  onChange={(e) => setMetaForm({ ...metaForm, nombre: e.target.value })} required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text" className="form-control" value={metaForm.descripcion}
                  onChange={(e) => setMetaForm({ ...metaForm, descripcion: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Meta anual</label>
                  <input
                    type="number" step="any" className="form-control" value={metaForm.meta_anual}
                    onChange={(e) => setMetaForm({ ...metaForm, meta_anual: e.target.value })} required
                  />
                </div>
                <div className="form-group">
                  <label>Unidad de medida</label>
                  <input
                    type="text" className="form-control" value={metaForm.unidad_medida}
                    onChange={(e) => setMetaForm({ ...metaForm, unidad_medida: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Frecuencia de medición</label>
                  <select
                    className="form-control" value={metaForm.frecuencia_medicion}
                    onChange={(e) => setMetaForm({ ...metaForm, frecuencia_medicion: e.target.value })} required
                  >
                    <option value="">Seleccione</option>
                    <option value="Mensual">Mensual</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha inicio</label>
                  <input
                    type="date" className="form-control" value={metaForm.fecha_inicio}
                    onChange={(e) => setMetaForm({ ...metaForm, fecha_inicio: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Fecha término</label>
                  <input
                    type="date" className="form-control" value={metaForm.fecha_termino}
                    onChange={(e) => setMetaForm({ ...metaForm, fecha_termino: e.target.value })}
                  />
                </div>
              </div>

              {errorModal && <p className="status-msg err">{errorModal}</p>}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : metaForm.id ? 'Actualizar' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detalle && (
        <div className="modal-overlay" onClick={() => setDetalle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{detalle.codigo_interno} · Detalle</h3>
              <button className="btn-close" onClick={() => setDetalle(null)}>×</button>
            </div>
            <div className="detalle-grid">
              <div className="detalle-item"><span>Nombre</span><strong>{detalle.nombre}</strong></div>
              <div className="detalle-item"><span>Estado</span><strong><EstadoBadge estado={detalle.estado} label={detalle.estado_label} /></strong></div>
              <div className="detalle-item"><span>Meta anual</span><strong>{detalle.meta_anual} {detalle.unidad_medida}</strong></div>
              <div className="detalle-item"><span>Avance actual</span><strong>{detalle.avance_actual} {detalle.unidad_medida}</strong></div>
              <div className="detalle-item"><span>% Cumplimiento</span><strong>{detalle.porcentaje_cumplimiento}%</strong></div>
              <div className="detalle-item"><span>% Esperado a la fecha</span><strong>{detalle.porcentaje_esperado}%</strong></div>
              <div className="detalle-item"><span>Frecuencia</span><strong>{detalle.frecuencia_medicion}</strong></div>
              <div className="detalle-item"><span>Periodo</span><strong>{detalle.fecha_inicio?.slice(0,10)} → {detalle.fecha_termino?.slice(0,10)}</strong></div>
              {detalle.descripcion && (
                <div className="detalle-item" style={{ gridColumn: '1 / -1' }}><span>Descripción</span><strong>{detalle.descripcion}</strong></div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Metas;

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LayoutDashboard, UploadCloud, Target, FileBarChart, Settings } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const Dashboard = () => {
  const [vistaActiva, setVistaActiva] = useState('Inicio');
  const [indicadores, setIndicadores] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [archivoCarga, setArchivoCarga] = useState(null);
  
  // Estado unificado para Crear/Editar
  const [metaForm, setMetaForm] = useState({ id: null, codigo_interno: '', nombre: '', meta_anual: '', frecuencia_medicion: '' });

  const cargarDatos = () => {
    fetch('http://localhost:5000/api/indicadores/dashboard')
      .then(res => res.json())
      .then(data => { if (data.exito) setIndicadores(data.data); })
      .catch(err => console.error(err));
  };

  useEffect(() => { cargarDatos(); }, []);

  // Lógica CRUD Integrada (Crear / Editar)
  const handleGuardarMeta = async (e) => {
    e.preventDefault();
    const url = metaForm.id 
      ? `http://localhost:5000/api/indicadores/editar/${metaForm.id}`
      : 'http://localhost:5000/api/indicadores/crear';
    const method = metaForm.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metaForm)
      });
      const data = await response.json();
      if (data.exito) {
        setModalAbierto(false);
        setMetaForm({ id: null, codigo_interno: '', nombre: '', meta_anual: '', frecuencia_medicion: '' });
        cargarDatos();
      } else alert('Error: ' + data.mensaje);
    } catch (error) { alert('Fallo de conexión.'); }
  };

  const abrirModalEdicion = (ind) => {
    setMetaForm({ id: ind.id, codigo_interno: ind.codigo_interno, nombre: ind.nombre, meta_anual: ind.meta_anual, frecuencia_medicion: ind.frecuencia_medicion });
    setModalAbierto(true);
  };

  const handleEliminarMeta = async (id) => {
    if (!window.confirm('¿Confirma la eliminación permanente?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/indicadores/eliminar/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.exito) cargarDatos();
    } catch (error) { alert('Fallo de conexión.'); }
  };

  const handleSubirArchivo = async (e) => {
    e.preventDefault();
    if (!archivoCarga) return alert('Seleccione un documento.');
    const formData = new FormData();
    formData.append('archivoExcel', archivoCarga);
    try {
      const response = await fetch('http://localhost:5000/api/indicadores/cargar-datos', { method: 'POST', body: formData });
      const data = await response.json();
      alert(data.mensaje);
      if (data.exito) {
        setArchivoCarga(null);
        document.getElementById('file-upload').value = '';
        cargarDatos(); // Refresca los gráficos inmediatamente
      }
    } catch (error) { alert('Error transmitiendo el documento.'); }
  };

  const generarPDF = () => {
    window.print(); // Se apoya en CSS de impresión para limpiar la vista
  };

  // Datos ordenados para el gráfico de retrasos
  const datosGrafico = [...indicadores]
    .sort((a, b) => (a.porcentaje_cumplimiento || 0) - (b.porcentaje_cumplimiento || 0))
    .slice(0, 5)
    .map(ind => ({ nombre: ind.codigo_interno, avance: ind.porcentaje_cumplimiento || 0 }));

  return (
    <div className="app-layout">
      {/* Sidebar oculta al imprimir PDF */}
      <div className="hide-on-print">
        <Sidebar vistaActiva={vistaActiva} setVistaActiva={setVistaActiva} />
      </div>
      
      <main className="main-area">
        <div className="hide-on-print"><Topbar /></div>
        <div className="content-wrapper printable-area">
          
          {vistaActiva === 'Inicio' && (
            <>
              <h2 className="page-title">Panel de Control Regional</h2>
              <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
                {indicadores.map(ind => (
                  <div key={ind.id} className="card">
                    <h3>{ind.nombre}</h3>
                    <div className="percentage-big">{ind.porcentaje_cumplimiento}%</div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${ind.porcentaje_cumplimiento}%` }}></div>
                    </div>
                    <div className="metric-details">
                      <span>Meta: <strong>{ind.meta_anual}</strong></span>
                      <span>Avance: <strong>{ind.avance_actual}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card hide-on-print">
                <h3>Top 5 Indicadores Críticos (Mayor Retraso)</h3>
                <div style={{ width: '100%', height: 250 }}>
                  <ResponsiveContainer>
                    <BarChart data={datosGrafico} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: '#f5f5f5'}} />
                      <Bar dataKey="avance" radius={[0, 4, 4, 0]} barSize={20} fill="#000000" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {vistaActiva === 'Cargar Datos' && (
            <>
              <h2 className="page-title">Procesamiento de Archivos</h2>
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px', borderStyle: 'dashed', borderWidth: '1px' }}>
                <h3 style={{ color: '#000', fontSize: '18px', marginBottom: '8px' }}>Carga Masiva (Excel/CSV)</h3>
                <p style={{ color: '#666', marginBottom: '8px', fontSize: '14px' }}>El archivo debe contener las columnas exactas: <strong>codigo_interno</strong> y <strong>avance</strong></p>
                <form onSubmit={handleSubirArchivo}>
                  <input type="file" id="file-upload" accept=".xlsx, .csv" onChange={(e) => setArchivoCarga(e.target.files[0])} style={{ display: 'block', margin: '20px auto' }} />
                  <button type="submit" className="btn-primary">Ejecutar Procesamiento</button>
                </form>
              </div>
            </>
          )}

          {vistaActiva === 'Metas' && (
            <>
              <h2 className="page-title">Módulo Administrativo de Indicadores</h2>
              <div className="card">
                <div className="table-toolbar">
                  <input type="text" className="search-input" placeholder="Buscar registros..." />
                  <button className="btn-primary" onClick={() => { 
                    setMetaForm({ id: null, codigo_interno: '', nombre: '', meta_anual: '', frecuencia_medicion: '' }); 
                    setModalAbierto(true); 
                  }}>Nueva Meta</button>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Código</th><th>Descripción</th><th>Meta</th><th>Avance</th><th style={{ textAlign: 'right' }}>Gestión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indicadores.map(ind => (
                      <tr key={ind.id}>
                        <td><strong>{ind.codigo_interno}</strong></td>
                        <td>{ind.nombre}</td>
                        <td>{ind.meta_anual}</td>
                        <td>{ind.porcentaje_cumplimiento}%</td>
                        <td style={{ textAlign: 'right' }}>
                          <button onClick={() => abrirModalEdicion(ind)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', marginRight: '16px', color: '#666' }}>Editar</button>
                          <button onClick={() => handleEliminarMeta(ind.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', color: '#000' }}>Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {modalAbierto && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>{metaForm.id ? 'Modificar Registro' : 'Nuevo Registro'}</h3>
                      <button className="btn-close" onClick={() => setModalAbierto(false)}>×</button>
                    </div>
                    <form onSubmit={handleGuardarMeta}>
                      <div className="form-group">
                        <label>Identificador</label>
                        <input type="text" className="form-control" value={metaForm.codigo_interno} onChange={(e) => setMetaForm({...metaForm, codigo_interno: e.target.value})} disabled={!!metaForm.id} required />
                      </div>
                      <div className="form-group">
                        <label>Nomenclatura</label>
                        <input type="text" className="form-control" value={metaForm.nombre} onChange={(e) => setMetaForm({...metaForm, nombre: e.target.value})} required />
                      </div>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Proyección Anual</label>
                          <input type="number" className="form-control" value={metaForm.meta_anual} onChange={(e) => setMetaForm({...metaForm, meta_anual: e.target.value})} required />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                          <label>Periodicidad</label>
                          <select className="form-control" value={metaForm.frecuencia_medicion} onChange={(e) => setMetaForm({...metaForm, frecuencia_medicion: e.target.value})} required>
                            <option value="">Selección Obligatoria</option>
                            <option value="Mensual">Mensual</option>
                            <option value="Trimestral">Trimestral</option>
                            <option value="Anual">Anual</option>
                          </select>
                        </div>
                      </div>
                      <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={() => setModalAbierto(false)}>Cancelar</button>
                        <button type="submit" className="btn-primary">{metaForm.id ? 'Actualizar' : 'Confirmar'}</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}

          {vistaActiva === 'Reportes' && (
            <>
              <h2 className="page-title hide-on-print">Extracción de Documentos</h2>
              <div className="card hide-on-print" style={{ maxWidth: '500px' }}>
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => {
                  setVistaActiva('Inicio'); // Cambia a la vista de inicio para imprimir el dashboard
                  setTimeout(generarPDF, 500); 
                }}>
                  Exportar PDF del Dashboard Actual
                </button>
              </div>
            </>
          )}

          {vistaActiva === 'Configuración' && (
            <>
              <h2 className="page-title">Administración del Sistema</h2>
              <div className="card" style={{ maxWidth: '600px' }}>
                <h3 style={{ borderBottom: '1px solid #000', paddingBottom: '12px', marginBottom: '20px' }}>Perfil de Seguridad</h3>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '13px', color: '#000', fontWeight: '600' }}>Usuario</label>
                    <input type="text" value="Administrador General" disabled style={{ width: '100%', padding: '10px', marginTop: '4px', border: '1px solid #000' }} />
                  </div>
                </div>
                <button className="btn-primary" style={{ backgroundColor: '#fff', color: '#000', border: '1px solid #000' }}>Cerrar Sesión</button>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
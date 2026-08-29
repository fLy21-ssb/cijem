import { useEffect, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { api } from '../api/client';
import EmptyState from '../components/EmptyState';

const CargarDatos = () => {
  const [archivo, setArchivo] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const inputRef = useRef(null);

  const [indicadores, setIndicadores] = useState([]);
  const [deltas, setDeltas] = useState({});
  const [guardandoId, setGuardandoId] = useState(null);
  const [mensajeManual, setMensajeManual] = useState('');

  const cargarIndicadores = () => {
    api.listarIndicadores().then((data) => setIndicadores(data.data)).catch(() => {});
  };

  useEffect(() => { cargarIndicadores(); }, []);

  const handleArchivoSeleccionado = (file) => {
    setArchivo(file);
    setResultado(null);
    setErrorCarga('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleArchivoSeleccionado(file);
  };

  const handleSubirArchivo = async () => {
    if (!archivo) return;
    setSubiendo(true);
    setErrorCarga('');
    setResultado(null);
    try {
      const data = await api.cargaMasiva(archivo);
      setResultado(data.data);
      setArchivo(null);
      if (inputRef.current) inputRef.current.value = '';
      cargarIndicadores();
    } catch (err) {
      setErrorCarga(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const handleGuardarManual = async (id) => {
    const delta = Number(deltas[id]);
    if (!Number.isFinite(delta) || delta === 0) return;
    setGuardandoId(id);
    setMensajeManual('');
    try {
      await api.cargarAvanceManual(id, delta);
      setDeltas((prev) => ({ ...prev, [id]: '' }));
      setMensajeManual('Avance registrado correctamente.');
      cargarIndicadores();
    } catch (err) {
      setMensajeManual(`Error: ${err.message}`);
    } finally {
      setGuardandoId(null);
    }
  };

  return (
    <>
      <h2 className="page-title">Carga de Datos</h2>

      <div
        className={`dropzone ${arrastrando ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <UploadCloud size={36} color="#3B5978" style={{ marginBottom: 12 }} />
        <h3>Carga Masiva (Excel/CSV)</h3>
        <p>Arrastre el archivo aquí o haga clic para seleccionarlo.</p>
        <p>El archivo debe contener las columnas exactas: <strong>codigo_interno</strong> y <strong>avance</strong></p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={(e) => handleArchivoSeleccionado(e.target.files?.[0])}
        />
        {archivo && <div className="dropzone-filename">Seleccionado: {archivo.name}</div>}
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
        <button className="btn-primary" onClick={handleSubirArchivo} disabled={!archivo || subiendo}>
          {subiendo ? 'Procesando...' : 'Ejecutar Procesamiento'}
        </button>
      </div>

      {errorCarga && <p className="status-msg err" style={{ maxWidth: 480, margin: '16px auto' }}>{errorCarga}</p>}

      {resultado && (
        <div className="card" style={{ maxWidth: 640, margin: '20px auto' }}>
          <p><strong>{resultado.filasActualizadas}</strong> de <strong>{resultado.filasTotales}</strong> filas actualizaron un indicador existente.</p>
          {resultado.codigosNoEncontrados.length > 0 && (
            <p style={{ marginTop: 8, color: '#A9720F', fontFamily: 'Public Sans, sans-serif', fontSize: 13 }}>
              Códigos no encontrados: {resultado.codigosNoEncontrados.join(', ')}
            </p>
          )}
        </div>
      )}

      <h2 className="page-title" style={{ marginTop: 40 }}>Carga Manual</h2>
      <div className="card">
        {indicadores.length === 0 ? (
          <EmptyState titulo="No hay indicadores para cargar avance" />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr><th>Código</th><th>Nombre</th><th>Avance actual</th><th>Sumar / restar</th><th></th></tr>
              </thead>
              <tbody>
                {indicadores.map((ind) => (
                  <tr key={ind.id}>
                    <td><strong>{ind.codigo_interno}</strong></td>
                    <td>{ind.nombre}</td>
                    <td>{ind.avance_actual} {ind.unidad_medida}</td>
                    <td>
                      <input
                        type="number" step="any" className="manual-input"
                        value={deltas[ind.id] || ''}
                        onChange={(e) => setDeltas((prev) => ({ ...prev, [ind.id]: e.target.value }))}
                        placeholder="0"
                      />
                    </td>
                    <td>
                      <button
                        className="btn-secondary"
                        onClick={() => handleGuardarManual(ind.id)}
                        disabled={guardandoId === ind.id || !deltas[ind.id]}
                      >
                        {guardandoId === ind.id ? 'Guardando...' : 'Aplicar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mensajeManual && <p className="status-msg ok" style={{ marginTop: 12 }}>{mensajeManual}</p>}
          </>
        )}
      </div>
    </>
  );
};

export default CargarDatos;

import { useState } from 'react';
import { api } from '../api/client';

function descargarBlob(blob, nombreArchivo) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

const Reportes = () => {
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [descargandoExcel, setDescargandoExcel] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [destinatario, setDestinatario] = useState('');
  const [formatoEmail, setFormatoEmail] = useState('pdf');
  const [mensaje, setMensaje] = useState(null);

  const handleDescargarPdf = async () => {
    setDescargandoPdf(true);
    setMensaje(null);
    try {
      const blob = await api.descargarReportePdf();
      descargarBlob(blob, 'reporte-cijem.pdf');
    } catch (err) {
      setMensaje({ tipo: 'err', texto: err.message });
    } finally {
      setDescargandoPdf(false);
    }
  };

  const handleDescargarExcel = async () => {
    setDescargandoExcel(true);
    setMensaje(null);
    try {
      const blob = await api.descargarReporteExcel();
      descargarBlob(blob, 'reporte-cijem.xlsx');
    } catch (err) {
      setMensaje({ tipo: 'err', texto: err.message });
    } finally {
      setDescargandoExcel(false);
    }
  };

  const handleEnviarEmail = async (e) => {
    e.preventDefault();
    if (!destinatario) return;
    setEnviando(true);
    setMensaje(null);
    try {
      const data = await api.enviarReportePorEmail(destinatario, formatoEmail);
      setMensaje({ tipo: 'ok', texto: data.mensaje });
    } catch (err) {
      setMensaje({ tipo: 'err', texto: err.message });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <h2 className="page-title">Reportes</h2>
      <div className="card reportes-actions" style={{ maxWidth: 560 }}>
        <p style={{ color: '#A3AED0', fontSize: 13 }}>
          Periodo: Enero – Diciembre 2026 · Informe ejecutivo de cumplimiento de todos los indicadores.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={handleDescargarPdf} disabled={descargandoPdf}>
            {descargandoPdf ? 'Generando PDF...' : 'Descargar PDF'}
          </button>
          <button className="btn-secondary" onClick={handleDescargarExcel} disabled={descargandoExcel}>
            {descargandoExcel ? 'Generando Excel...' : 'Descargar Excel'}
          </button>
        </div>

        <form onSubmit={handleEnviarEmail} style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #E0E5F2' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Enviar por Email</label>
          <div className="email-form">
            <input
              type="email" className="form-control" placeholder="destinatario@junji.cl"
              value={destinatario} onChange={(e) => setDestinatario(e.target.value)} required
            />
            <select className="select-control" value={formatoEmail} onChange={(e) => setFormatoEmail(e.target.value)}>
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
            </select>
            <button type="submit" className="btn-primary" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>

        {mensaje && <p className={`status-msg ${mensaje.tipo}`}>{mensaje.texto}</p>}
      </div>
    </>
  );
};

export default Reportes;

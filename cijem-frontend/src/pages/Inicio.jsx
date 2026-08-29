import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../api/client';
import EmptyState from '../components/EmptyState';

const COLOR_ESTADO = { Verde: '#3C6E47', Amarillo: '#A9720F', Rojo: '#A6362B' };
const TICK_MONO = { fontSize: 11, fontFamily: 'Public Sans, sans-serif', fill: '#4A5568' };
const fechaHoy = new Date().toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });

const ReglaAvance = ({ valor }) => {
  const marcas = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  return (
    <div className="regla-avance">
      <div className="regla-track">
        <div className="regla-base" />
        <div className="regla-fill" style={{ width: `${valor}%` }} />
        {marcas.map((m) => (
          <div key={m} className={`regla-tick ${m % 50 === 0 ? 'mayor' : ''}`} style={{ left: `${m}%` }} />
        ))}
        <div className="regla-marcador" style={{ left: `${valor}%` }}>{valor}%</div>
      </div>
    </div>
  );
};

const Inicio = () => {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .resumenDashboard()
      .then((data) => setResumen(data.data))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando panel de control...</p>;
  if (error) return <p className="status-msg err">{error}</p>;
  if (!resumen || resumen.totalIndicadores === 0) {
    return (
      <>
        <h2 className="page-title">Panel de Control Regional</h2>
        <div className="card">
          <EmptyState
            titulo="Todavía no hay indicadores registrados"
            descripcion="Cree una meta en la sección Metas o cargue datos masivamente para ver el panel completo."
          />
        </div>
      </>
    );
  }

  const datosGrafico = resumen.masAtrasados.map((ind) => ({
    nombre: ind.codigo_interno,
    avance: ind.porcentaje_cumplimiento,
    estado: ind.estado,
  }));

  return (
    <>
      <h2 className="page-title">Panel de Control Regional</h2>

      <div className="hoja-registro">
        <div className="hoja-registro-header">
          <span>Registro de Avance — Periodo 2026</span>
          <span className="num-registro">Actualizado {fechaHoy}</span>
        </div>
        <div className="campos-registro">
          <div className="campo-registro" style={{ gridColumn: 'span 2' }}>
            <div className="campo-etiqueta">Avance global</div>
            <ReglaAvance valor={resumen.avanceGlobal} />
          </div>
          <div className="campo-registro">
            <div className="campo-etiqueta">Total indicadores</div>
            <div className="campo-valor">{resumen.totalIndicadores}</div>
          </div>
          <div className="campo-registro">
            <div className="campo-etiqueta">En alerta</div>
            <div className={`campo-valor ${resumen.totalAlertas > 0 ? 'alerta' : ''}`}>{resumen.totalAlertas}</div>
          </div>
        </div>
        <div className="campos-registro" style={{ borderTop: '1px solid var(--linea)' }}>
          <div className="campo-registro" style={{ gridColumn: 'span 3' }}>
            <div className="campo-etiqueta">Metas críticas — bajo el 75% del avance esperado a la fecha</div>
            <div className={`campo-valor ${resumen.totalCriticos > 0 ? 'critico' : ''}`}>{resumen.totalCriticos}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="card">
          <h3>Top 5 Metas con Mayor Retraso</h3>
          {datosGrafico.length === 0 ? (
            <EmptyState titulo="No hay suficientes datos para el gráfico" />
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={datosGrafico} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" domain={[0, 100]} tick={TICK_MONO} />
                  <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={TICK_MONO} />
                  <Tooltip cursor={{ fill: '#F2F3EE' }} contentStyle={{ fontFamily: 'Public Sans, sans-serif', fontSize: 12, border: '1px solid #16213A', borderRadius: 0 }} />
                  <Bar dataKey="avance" radius={0} barSize={16}>
                    {datosGrafico.map((entry, i) => (
                      <Cell key={i} fill={COLOR_ESTADO[entry.estado] || '#3B5978'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card notifications-panel">
          <h3>Notificaciones</h3>
          {resumen.notificaciones.length === 0 ? (
            <EmptyState titulo="Sin alertas" descripcion="No hay indicadores en estado crítico." />
          ) : (
            resumen.notificaciones.map((n) => (
              <div key={n.id} className="notification-card">
                {n.mensaje}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Inicio;

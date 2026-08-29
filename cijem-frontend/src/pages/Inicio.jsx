import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { api } from '../api/client';
import EmptyState from '../components/EmptyState';

const COLOR_ESTADO = { Verde: '#3C6E47', Amarillo: '#A9720F', Rojo: '#A6362B' };
const TICK_MONO = { fontSize: 11, fontFamily: 'IBM Plex Mono, monospace', fill: '#4A5568' };

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

  const datosDonut = [
    { name: 'Cumplido', value: resumen.avanceGlobal, fill: '#3B5978' },
    { name: 'Pendiente', value: Math.max(0, 100 - resumen.avanceGlobal), fill: '#DDD7C4' },
  ];

  const datosGrafico = resumen.masAtrasados.map((ind) => ({
    nombre: ind.codigo_interno,
    avance: ind.porcentaje_cumplimiento,
    estado: ind.estado,
  }));

  return (
    <>
      <h2 className="page-title">Panel de Control Regional</h2>

      <div className="dashboard-grid">
        <div className="card stat-card donut-card">
          <h3>Avance Global</h3>
          <div style={{ width: '100%', height: 140, position: 'relative' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={datosDonut} dataKey="value" innerRadius={45} outerRadius={65} startAngle={90} endAngle={-270}>
                  {datosDonut.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="donut-center-label">{resumen.avanceGlobal}%</span>
            </div>
          </div>
        </div>

        <div className="card stat-card">
          <h3>Total Indicadores</h3>
          <div className="stat-value">{resumen.totalIndicadores}</div>
          <div className="stat-sub">metas activas en el periodo</div>
        </div>

        <div className="card stat-card">
          <h3>En Alerta</h3>
          <div className="stat-value" style={{ color: '#A9720F' }}>{resumen.totalAlertas}</div>
          <div className="stat-sub">requieren seguimiento</div>
        </div>

        <div className="card stat-card">
          <h3>Metas Críticas</h3>
          <div className="stat-value critico">{resumen.totalCriticos}</div>
          <div className="stat-sub">bajo el 75% del avance esperado</div>
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
                  <Tooltip cursor={{ fill: '#F2F3EE' }} contentStyle={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, border: '1px solid #16213A', borderRadius: 0 }} />
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

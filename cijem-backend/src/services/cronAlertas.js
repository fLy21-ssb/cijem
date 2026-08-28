const cron = require('node-cron');
const pool = require('../config/db');
const { calcularSemaforo, ESTADOS } = require('../utils/semaforo');
const { enviarCorreo, smtpConfigurado } = require('./mailer');

// Revisa todos los indicadores y, si alguno está en estado Crítico, envía un
// correo de alerta a la dirección configurada (ALERTA_EMAIL_DESTINO).
// Si no hay configuración SMTP, la revisión igual se ejecuta pero el envío
// se omite dejando constancia en el log — el sistema sigue funcionando normal.
async function revisarIndicadoresCriticos() {
  const { rows } = await pool.query('SELECT * FROM indicadores');
  const criticos = rows
    .map((ind) => ({ ind, semaforo: calcularSemaforo(ind) }))
    .filter(({ semaforo }) => semaforo.estado === ESTADOS.ROJO);

  if (criticos.length === 0) {
    console.log('[cronAlertas] Revisión diaria: sin indicadores en estado Crítico.');
    return;
  }

  const destino = process.env.ALERTA_EMAIL_DESTINO;
  console.log(`[cronAlertas] ${criticos.length} indicador(es) en estado Crítico detectados.`);

  if (!destino) {
    console.warn('[cronAlertas] ALERTA_EMAIL_DESTINO no configurado; no se envía correo de alerta.');
    return;
  }
  if (!smtpConfigurado()) {
    console.warn('[cronAlertas] SMTP no configurado; no se envía correo de alerta.');
    return;
  }

  const listado = criticos
    .map(({ ind, semaforo }) => `- ${ind.codigo_interno} · ${ind.nombre} (${semaforo.porcentajeCumplimiento}% de avance vs ${semaforo.porcentajeEsperado}% esperado)`)
    .join('\n');

  try {
    await enviarCorreo({
      para: destino,
      asunto: `CIJEM: ${criticos.length} indicador(es) en estado Crítico`,
      texto: `Los siguientes indicadores están en estado Crítico:\n\n${listado}`,
    });
    console.log('[cronAlertas] Correo de alerta enviado correctamente.');
  } catch (error) {
    console.error('[cronAlertas] Error enviando correo de alerta:', error.message);
  }
}

// Expresión cron configurable vía ALERTA_CRON (por defecto, todos los días a las 08:00).
function iniciarCronAlertas() {
  const expresion = process.env.ALERTA_CRON || '0 8 * * *';
  if (!cron.validate(expresion)) {
    console.error(`[cronAlertas] Expresión cron inválida: "${expresion}". No se programó la tarea.`);
    return null;
  }
  const tarea = cron.schedule(expresion, revisarIndicadoresCriticos);
  console.log(`[cronAlertas] Tarea programada con expresión "${expresion}".`);
  return tarea;
}

module.exports = { iniciarCronAlertas, revisarIndicadoresCriticos };

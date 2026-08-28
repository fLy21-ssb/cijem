const pool = require('../config/db');

async function registrarAuditoria({ usuario, accion, tablaAfectada = 'indicadores', registroId = null, detalle = {} }) {
  await pool.query(
    `INSERT INTO auditoria (usuario_id, usuario_nombre, accion, tabla_afectada, registro_id, detalle)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [usuario?.id || null, usuario?.nombre || 'Desconocido', accion, tablaAfectada, registroId, JSON.stringify(detalle)]
  );
}

module.exports = { registrarAuditoria };

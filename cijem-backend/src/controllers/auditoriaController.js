const pool = require('../config/db');

const ACCIONES_VALIDAS = ['CREAR', 'EDITAR', 'ELIMINAR', 'CARGA_MASIVA'];

const listarAuditoria = async (req, res) => {
  try {
    const { accion } = req.query;

    if (accion && !ACCIONES_VALIDAS.includes(accion)) {
      return res.status(400).json({ exito: false, mensaje: 'Tipo de acción inválido.' });
    }

    const { rows } = accion
      ? await pool.query('SELECT * FROM auditoria WHERE accion = $1 ORDER BY fecha DESC LIMIT 500', [accion])
      : await pool.query('SELECT * FROM auditoria ORDER BY fecha DESC LIMIT 500');

    res.json({ exito: true, data: rows });
  } catch (error) {
    console.error('Error listando auditoría:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { listarAuditoria };

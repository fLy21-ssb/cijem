const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { registrarAuditoria } = require('../middleware/auditoria');

const ROLES_VALIDOS = ['Administrador', 'Gestor'];

const listarUsuarios = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, rut, nombre, rol, creado_en FROM usuarios ORDER BY nombre ASC'
    );
    res.json({ exito: true, data: rows });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

const crearUsuario = async (req, res) => {
  try {
    const { rut, nombre, password, rol } = req.body;
    if (!rut || !nombre || !password || !rol) {
      return res.status(400).json({ exito: false, mensaje: 'RUT, nombre, contraseña y rol son obligatorios.' });
    }
    if (!ROLES_VALIDOS.includes(rol)) {
      return res.status(400).json({ exito: false, mensaje: 'Rol inválido. Use "Administrador" o "Gestor".' });
    }
    if (password.length < 8) {
      return res.status(400).json({ exito: false, mensaje: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO usuarios (rut, nombre, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, rut, nombre, rol, creado_en',
      [rut, nombre, hash, rol]
    );

    await registrarAuditoria({
      usuario: req.usuario,
      accion: 'CREAR',
      tablaAfectada: 'usuarios',
      registroId: rows[0].id,
      detalle: { rut, nombre, rol },
    });

    res.status(201).json({ exito: true, data: rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ exito: false, mensaje: 'Ya existe un usuario con ese RUT.' });
    }
    console.error('Error creando usuario:', error);
    res.status(500).json({ exito: false, mensaje: 'Error interno del servidor.' });
  }
};

module.exports = { listarUsuarios, crearUsuario };

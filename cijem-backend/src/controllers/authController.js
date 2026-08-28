const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { obtenerSecreto } = require('../middleware/auth');

const login = async (req, res) => {
  try {
    const { rut, password } = req.body;
    if (!rut || !password) {
      return res.status(400).json({ exito: false, mensaje: 'RUT y contraseña son obligatorios.' });
    }

    const { rows } = await pool.query('SELECT * FROM usuarios WHERE rut = $1', [rut]);
    const usuario = rows[0];

    // Comparamos siempre contra un hash (aunque no exista el usuario) para
    // no filtrar por temporización si el RUT existe o no.
    const hashComparar = usuario ? usuario.password_hash : '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva';
    const passwordValido = await bcrypt.compare(password, hashComparar);

    if (!usuario || !passwordValido) {
      return res.status(401).json({ exito: false, mensaje: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      { id: usuario.id, rut: usuario.rut, nombre: usuario.nombre, rol: usuario.rol },
      obtenerSecreto(),
      { expiresIn: '8h' }
    );

    res.json({
      exito: true,
      token,
      usuario: { id: usuario.id, rut: usuario.rut, nombre: usuario.nombre, rol: usuario.rol },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ exito: false, mensaje: 'Error de servicio.' });
  }
};

module.exports = { login };

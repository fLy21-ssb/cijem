const express = require('express');
const router = express.Router();
const { listarUsuarios, crearUsuario } = require('../controllers/usuarioController');
const { requiereRol } = require('../middleware/auth');

// Todo este router ya está protegido por verificarToken a nivel de server.js.
// Solo Administrador puede gestionar usuarios.
router.get('/', requiereRol('Administrador'), listarUsuarios);
router.post('/', requiereRol('Administrador'), crearUsuario);

module.exports = router;

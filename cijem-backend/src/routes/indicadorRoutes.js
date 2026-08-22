const express = require('express');
const router = express.Router();
const multer = require('multer');
const { getDashboard, procesarCargaMasiva, crearMeta, editarMeta, eliminarMeta, login } = require('../controllers/indicadorController');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/login', login);
router.get('/dashboard', getDashboard);
router.post('/cargar-datos', upload.single('archivoExcel'), procesarCargaMasiva);
router.post('/crear', crearMeta);
router.put('/editar/:id', editarMeta); // RUTA DE EDICIÓN
router.delete('/eliminar/:id', eliminarMeta);

module.exports = router;
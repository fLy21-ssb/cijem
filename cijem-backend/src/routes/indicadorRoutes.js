const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  listarIndicadores,
  resumenDashboard,
  crearMeta,
  editarMeta,
  eliminarMeta,
  cargarAvanceManual,
  procesarCargaMasiva,
  proyeccionIndicador,
} = require('../controllers/indicadorController');
const { requiereRol } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Router ya protegido por verificarToken a nivel de server.js.
router.get('/', listarIndicadores);
router.get('/resumen', resumenDashboard);
router.post('/', crearMeta);
router.put('/:id', editarMeta);
router.delete('/:id', requiereRol('Administrador'), eliminarMeta);
router.patch('/:id/avance', cargarAvanceManual);
router.get('/:id/proyeccion', proyeccionIndicador);
router.post('/carga-masiva', upload.single('archivoExcel'), procesarCargaMasiva);

module.exports = router;

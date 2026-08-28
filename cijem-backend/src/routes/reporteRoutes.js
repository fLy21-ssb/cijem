const express = require('express');
const router = express.Router();
const { generarReportePdf, generarReporteExcel, enviarReportePorCorreo } = require('../controllers/reporteController');

router.get('/pdf', generarReportePdf);
router.get('/excel', generarReporteExcel);
router.post('/email', enviarReportePorCorreo);

module.exports = router;

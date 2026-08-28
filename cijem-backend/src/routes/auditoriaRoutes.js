const express = require('express');
const router = express.Router();
const { listarAuditoria } = require('../controllers/auditoriaController');

router.get('/', listarAuditoria);

module.exports = router;

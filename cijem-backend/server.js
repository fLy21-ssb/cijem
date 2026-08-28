const express = require('express');
const cors = require('cors');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurado. Defínalo en el archivo .env antes de iniciar el servidor.');
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET no está configurado. Defínalo en el archivo .env antes de iniciar el servidor.');
  process.exit(1);
}

const authRoutes = require('./src/routes/authRoutes');
const indicadorRoutes = require('./src/routes/indicadorRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const auditoriaRoutes = require('./src/routes/auditoriaRoutes');
const reporteRoutes = require('./src/routes/reporteRoutes');
const { verificarToken } = require('./src/middleware/auth');
const { iniciarCronAlertas } = require('./src/services/cronAlertas');

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de estado (pública, sin datos sensibles)
app.get('/api/estado', (req, res) => {
  res.json({ mensaje: 'Servidor CIJEM funcionando correctamente' });
});

// Login es la única ruta de datos pública.
app.use('/api/auth', authRoutes);

// Todo lo demás exige un JWT válido.
app.use('/api/indicadores', verificarToken, indicadorRoutes);
app.use('/api/usuarios', verificarToken, usuarioRoutes);
app.use('/api/auditoria', verificarToken, auditoriaRoutes);
app.use('/api/reportes', verificarToken, reporteRoutes);

app.use((req, res) => {
  res.status(404).json({ exito: false, mensaje: 'Recurso no encontrado.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
  if (process.env.NODE_ENV !== 'test') {
    iniciarCronAlertas();
  }
});

module.exports = app;

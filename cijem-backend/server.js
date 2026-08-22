const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./src/config/db');

// Importar las rutas que creamos
const indicadorRoutes = require('./src/routes/indicadorRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Usar las rutas
app.use('/api/indicadores', indicadorRoutes);

// Ruta de estado
app.get('/api/estado', (req, res) => {
  res.json({ mensaje: 'Servidor CIJEM funcionando correctamente 🚀' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
});
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Prueba la conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error al conectar con PostgreSQL (Neon):', err.stack);
  } else {
    console.log('✅ Conexión exitosa a la base de datos CIJEM_DB');
  }
  if (client) release();
});

module.exports = pool;
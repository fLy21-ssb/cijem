// Script de línea de comandos para crear (o resetear la contraseña de) un
// usuario, típicamente el primer Administrador del sistema.
//
// No se hardcodean credenciales en el código: el RUT, nombre, rol y
// contraseña se reciben por argumentos o variables de entorno, y la
// contraseña se hashea con bcrypt antes de guardarla.
//
// Uso:
//   node scripts/crearUsuario.js --rut 11111111-1 --nombre "Nombre Apellido" --rol Administrador
//   (si no se pasa --password, se pide interactivamente sin eco en pantalla)

require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

function parsearArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const clave = argv[i].slice(2);
      const valor = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[clave] = valor;
    }
  }
  return args;
}

function pedirPasswordOculto(pregunta) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const stdin = process.stdin;
    process.stdout.write(pregunta);
    let password = '';
    stdin.resume();
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.on('data', function handler(char) {
      char = char.toString();
      if (char === '\n' || char === '\r' || char === '') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', handler);
        process.stdout.write('\n');
        rl.close();
        resolve(password);
      } else if (char === '') {
        process.exit(1);
      } else if (char === '') {
        password = password.slice(0, -1);
      } else {
        password += char;
      }
    });
  });
}

async function main() {
  const args = parsearArgs(process.argv.slice(2));
  const rut = args.rut || process.env.SEED_ADMIN_RUT;
  const nombre = args.nombre || process.env.SEED_ADMIN_NOMBRE;
  const rol = args.rol || process.env.SEED_ADMIN_ROL || 'Administrador';
  let password = args.password || process.env.SEED_ADMIN_PASSWORD;

  if (!rut || !nombre) {
    console.error('Uso: node scripts/crearUsuario.js --rut <RUT> --nombre "<Nombre>" [--rol Administrador|Gestor] [--password <clave>]');
    process.exit(1);
  }
  if (!['Administrador', 'Gestor'].includes(rol)) {
    console.error('Rol inválido. Debe ser "Administrador" o "Gestor".');
    process.exit(1);
  }
  if (!password) {
    password = await pedirPasswordOculto('Contraseña para el nuevo usuario: ');
  }
  if (!password || password.length < 8) {
    console.error('La contraseña debe tener al menos 8 caracteres.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  try {
    const existente = await pool.query('SELECT id FROM usuarios WHERE rut = $1', [rut]);
    if (existente.rows.length > 0) {
      await pool.query('UPDATE usuarios SET nombre = $1, password_hash = $2, rol = $3 WHERE rut = $4', [nombre, hash, rol, rut]);
      console.log(`Usuario ${rut} actualizado (contraseña reseteada).`);
    } else {
      await pool.query(
        'INSERT INTO usuarios (rut, nombre, password_hash, rol) VALUES ($1, $2, $3, $4)',
        [rut, nombre, hash, rol]
      );
      console.log(`Usuario ${rut} (${rol}) creado correctamente.`);
    }
  } catch (error) {
    console.error('Error creando el usuario:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

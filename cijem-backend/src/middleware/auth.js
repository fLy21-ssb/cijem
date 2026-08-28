const jwt = require('jsonwebtoken');

function obtenerSecreto() {
  const secreto = process.env.JWT_SECRET;
  if (!secreto) {
    throw new Error('JWT_SECRET no está configurado. Defínalo en las variables de entorno antes de iniciar el servidor.');
  }
  return secreto;
}

function verificarToken(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const [esquema, token] = encabezado.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return res.status(401).json({ exito: false, mensaje: 'Token de acceso no proporcionado.' });
  }

  try {
    const payload = jwt.verify(token, obtenerSecreto());
    req.usuario = { id: payload.id, rut: payload.rut, nombre: payload.nombre, rol: payload.rol };
    next();
  } catch (error) {
    return res.status(401).json({ exito: false, mensaje: 'Token inválido o expirado.' });
  }
}

function requiereRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ exito: false, mensaje: 'No tiene permisos suficientes para esta acción.' });
    }
    next();
  };
}

module.exports = { verificarToken, requiereRol, obtenerSecreto };

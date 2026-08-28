const nodemailer = require('nodemailer');

function smtpConfigurado() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transportador = null;
function obtenerTransportador() {
  if (!smtpConfigurado()) return null;
  if (!transportador) {
    transportador = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transportador;
}

// Envía un correo si SMTP está configurado. Si no lo está, el sistema debe
// seguir funcionando con normalidad: solo se deja constancia en el log.
async function enviarCorreo({ para, asunto, texto, html, adjuntos = [] }) {
  const transporte = obtenerTransportador();
  if (!transporte) {
    console.warn(`[mailer] SMTP no configurado. No se envió el correo "${asunto}" a ${para}.`);
    return { enviado: false, motivo: 'SMTP no configurado' };
  }

  await transporte.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: para,
    subject: asunto,
    text: texto,
    html,
    attachments: adjuntos,
  });

  return { enviado: true };
}

module.exports = { enviarCorreo, smtpConfigurado };

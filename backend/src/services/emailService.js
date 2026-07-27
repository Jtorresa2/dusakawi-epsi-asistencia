const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function enviarCredenciales({ email, nombre, username, password, link }) {
  const t = getTransporter();
  if (!t) {
    console.log('[EMAIL] SMTP no configurado. No se envio correo a', email);
    return { enviado: false, motivo: 'SMTP no configurado' };
  }
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || 'noreply@dusakawiepsi.com',
      to: email,
      subject: 'Tus credenciales de acceso - Dusakawi EPSI',
      html: '<div style="font-family:Segoe UI,sans-serif;max-width:500px;margin:auto;padding:20px">' +
        '<h2 style="color:#1B5E20">Bienvenido, ' + nombre + '!</h2>' +
        '<p>Se ha creado tu cuenta en el sistema de asistencia <strong>Dusakawi EPSI</strong>.</p>' +
        '<div style="background:#f0fdf4;padding:16px;border-radius:10px;margin:16px 0">' +
        '<p style="margin:4px 0"><strong>Usuario:</strong> ' + username + '</p>' +
        '<p style="margin:4px 0"><strong>Contrasena inicial:</strong> ' + password + '</p></div>' +
        '<p>Por seguridad, al iniciar sesion se te pedira cambiar la contrasena.</p>' +
        '<a href="' + link + '" style="display:inline-block;background:#1B5E20;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:12px 0">Ir al sistema</a>' +
        '<p style="font-size:12px;color:#6B7280;margin-top:20px">Si no solicitaste esta cuenta, ignora este mensaje.</p></div>',
    });
    console.log('[EMAIL] Enviado a', email);
    return { enviado: true };
  } catch (err) {
    console.error('[EMAIL] Error al enviar a', email, err.message);
    return { enviado: false, motivo: err.message };
  }
}

module.exports = { enviarCredenciales };

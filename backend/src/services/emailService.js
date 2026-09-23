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

async function enviarResetPassword({ email, nombre, username, link, primerIngreso = false }) {
  const t = getTransporter();
  if (!t) {
    console.log('[EMAIL] SMTP no configurado. No se envio correo a', email);
    return { enviado: false, motivo: 'SMTP no configurado' };
  }
  const esPrimerIngreso = primerIngreso;
  const subject = esPrimerIngreso
    ? 'Activa tu cuenta de acceso - Dusakawi EPSI'
    : 'Restablece tu contrasena - Dusakawi EPSI';

  const botonTexto = esPrimerIngreso ? 'Crear mi contrasena' : 'Restablecer contrasena';
  const avisoCaducidad = esPrimerIngreso
    ? 'Este enlace es de un solo uso y estara disponible durante 7 dias.'
    : 'Este enlace es de un solo uso y estara disponible durante 30 minutos.';
  const saludo = 'Hola, ' + nombre;

  const bloqueUsuario = username
    ? '<tr><td style="padding:22px 40px 4px 40px;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E8F5E9;border-radius:10px;">' +
      '<tr><td style="padding:16px 20px;">' +
      '<p style="margin:0 0 3px 0;font-family:Arial,Helvetica,sans-serif;font-size:10.5px;font-weight:700;color:#2E7D32;letter-spacing:1.4px;text-transform:uppercase;">Usuario</p>' +
      '<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:#1B5E20;">' + username + '</p>' +
      '</td></tr></table></td></tr>'
    : '';

  const html =
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F3F4F6;">' +
    '<tr><td align="center" style="padding:36px 16px;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:#FFFFFF;border:1px solid #E5E7EB;border-radius:14px;">' +
    '<tr><td style="padding:0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#E8F5E9;border-radius:14px 14px 0 0;">' +
    '<tr><td align="center" style="padding:28px 24px 22px 24px;">' +
    '<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:19px;font-weight:700;color:#1B5E20;">DUSAKAWI EPSI</p>' +
    '<p style="margin:3px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;color:#2E7D32;letter-spacing:1.6px;text-transform:uppercase;">Sistema de Control de Asistencia</p>' +
    '</td></tr></table>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
    '<tr><td style="padding:32px 40px 8px 40px;">' +
    '<p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:700;color:#1B5E20;">' + (esPrimerIngreso ? 'Activa tu cuenta de acceso' : 'Restablece tu contrasena') + '</p>' +
    '<p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#111827;">' + saludo + '</p>' +
    '</td></tr>' +
    '<tr><td style="padding:0 40px;">' +
    '<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:#4B5563;">' +
    (esPrimerIngreso
      ? 'Tu cuenta de acceso al Sistema de Control de Asistencia de Dusakawi EPSI ha sido creada correctamente. Para comenzar a utilizar el sistema, establece una contrasena personal y segura.'
      : 'Recibimos una solicitud para restablecer tu contrasena en el Sistema de Control de Asistencia de Dusakawi EPSI. Si fuiste tu quien la solicito, sigue el boton para crear una contrasena nueva y segura.') +
    '</p></td></tr>' +
    bloqueUsuario +
    '<tr><td align="center" style="padding:26px 40px 8px 40px;">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td align="center" style="border-radius:9px;background-color:#1B5E20;">' +
    '<a href="' + link + '" target="_blank" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;background-color:#1B5E20;padding:14px 32px;border-radius:9px;line-height:22px;">' + botonTexto + '</a>' +
    '</td></tr></table>' +
    '<p style="margin:10px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9CA3AF;">' + avisoCaducidad + '</p>' +
    '</td></tr>' +
    '<tr><td style="padding:22px 40px 0 40px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F3F4F6;border:1px solid #E5E7EB;border-radius:10px;">' +
    '<tr><td style="padding:14px 18px;">' +
    '<p style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;font-weight:700;color:#111827;">' + (esPrimerIngreso ? 'No solicitaste esta cuenta?' : 'No solicitaste este cambio?') + '</p>' +
    '<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.6;color:#4B5563;">No realices ninguna accion. Puedes ignorar este correo. Si consideras que se trata de un error, comunicate con el area de Talento Humano de Dusakawi EPSI.</p>' +
    '</td></tr></table></td></tr>' +
    '<tr><td style="padding:16px 40px 0 40px;">' +
    '<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;color:#4B5563;"><span style="font-weight:700;color:#B3261E;">Importante:</span> nunca compartas este enlace ni tu contrasena con otras personas.</p>' +
    '</td></tr></table>' +
    '<tr><td align="center" style="padding:18px 20px 22px 20px;">' +
    '<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;font-weight:700;color:#4B5563;">Dusakawi EPSI - Sistema de Control de Asistencia</p>' +
    '<p style="margin:5px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9CA3AF;">Este es un mensaje automatico. Por favor, no respondas a este correo.</p>' +
    '</td></tr>' +
    '</td></tr></table></td></tr></table>';

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || 'noreply@dusakawiepsi.com',
      to: email,
      subject,
      html,
    });
    console.log('[EMAIL] Enviado a', email);
    return { enviado: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[EMAIL] Error al enviar a', email, msg);
    return { enviado: false, motivo: msg };
  }
}

module.exports = { enviarCredenciales, enviarResetPassword };

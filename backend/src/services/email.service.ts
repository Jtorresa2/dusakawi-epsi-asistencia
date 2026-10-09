import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

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

export async function enviarCredenciales({
  email,
  nombre,
  username,
  password,
  link,
}: {
  email: string;
  nombre: string;
  username: string;
  password: string;
  link: string;
}) {
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
      html:
        '<div style="font-family:Segoe UI,sans-serif;max-width:500px;margin:auto;padding:20px">' +
        '<h2 style="color:#1B5E20">Bienvenido, ' +
        nombre +
        '!</h2>' +
        '<p>Se ha creado tu cuenta en el sistema de asistencia <strong>Dusakawi EPSI</strong>.</p>' +
        '<div style="background:#f0fdf4;padding:16px;border-radius:10px;margin:16px 0">' +
        '<p style="margin:4px 0"><strong>Usuario:</strong> ' +
        username +
        '</p>' +
        '<p style="margin:4px 0"><strong>Contrasena inicial:</strong> ' +
        password +
        '</p></div>' +
        '<p>Por seguridad, al iniciar sesion se te pedira cambiar la contrasena.</p>' +
        '<a href="' +
        link +
        '" style="display:inline-block;background:#1B5E20;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:12px 0">Ir al sistema</a>' +
        '<p style="font-size:12px;color:#6B7280;margin-top:20px">Si no solicitaste esta cuenta, ignora este mensaje.</p></div>',
    });
    return { enviado: true };
  } catch (err: any) {
    console.error('[EMAIL] Error enviando correo:', err?.message || err);
    return { enviado: false, motivo: err?.message };
  }
}

export async function enviarResetPassword({
  email,
  nombre,
  username,
  link,
  primerIngreso = false,
}: {
  email: string;
  nombre: string;
  username: string;
  link: string;
  primerIngreso?: boolean;
}) {
  const t = getTransporter();
  if (!t) {
    console.log('[EMAIL] SMTP no configurado. No se envio correo a', email);
    return { enviado: false, motivo: 'SMTP no configurado' };
  }
  const asunto = primerIngreso
    ? 'Acceso al Sistema de Asistencia - Dusakawi EPSI'
    : 'Restablecer contraseña - Dusakawi EPSI';
  const titulo = primerIngreso
    ? `¡Hola, ${nombre}!`
    : 'Restablecimiento de Contraseña';
  const textoPrincipal = primerIngreso
    ? 'Se ha habilitado tu usuario en el sistema de asistencia institucional. Haz clic en el siguiente botón para asignar tu contraseña de acceso:'
    : 'Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente botón para continuar:';
  const textoBoton = primerIngreso
    ? 'Asignar mi contraseña'
    : 'Restablecer contraseña';

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || 'noreply@dusakawiepsi.com',
      to: email,
      subject: asunto,
      html:
        '<div style="font-family:Segoe UI,sans-serif;max-width:520px;margin:auto;padding:24px;background:#f9fafb;border-radius:12px">' +
        '<div style="background:#fff;padding:28px;border-radius:10px;border:1px solid #e5e7eb">' +
        '<h2 style="color:#1B5E20;margin-top:0">' +
        titulo +
        '</h2>' +
        '<p style="color:#374151;line-height:1.6">' +
        textoPrincipal +
        '</p>' +
        '<div style="background:#f0fdf4;padding:12px 16px;border-radius:8px;margin:16px 0">' +
        '<p style="margin:0;color:#166534;font-size:13px"><strong>Usuario:</strong> ' +
        username +
        '</p>' +
        '</div>' +
        '<div style="text-align:center;margin:24px 0">' +
        '<a href="' +
        link +
        '" style="display:inline-block;background:#1B5E20;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">' +
        textoBoton +
        '</a>' +
        '</div>' +
        '<p style="color:#6b7280;font-size:12px;line-height:1.5;margin-bottom:0">' +
        'Este enlace expirará en 24 horas. Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura.' +
        '</p>' +
        '</div>' +
        '</div>',
    });
    return { enviado: true };
  } catch (err: any) {
    console.error('[EMAIL] Error enviando correo:', err?.message || err);
    return { enviado: false, motivo: err?.message };
  }
}

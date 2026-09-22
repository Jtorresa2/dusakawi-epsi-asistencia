import nodemailer, { Transporter } from 'nodemailer';
import { EnviarResetPasswordParams, EmailResult } from '../types';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

// ─── Paleta institucional ─────────────────────────────────────────────────────
const VERDE_OSCURO = '#1B5E20';
const VERDE = '#2E7D32';
const VERDE_CLARO = '#E8F5E9';
const GRIS_TEXTO = '#4B5563';
const GRIS_SUAVE = '#9CA3AF';
const GRIS_FONDO = '#F3F4F6';
const GRIS_BORDE = '#E5E7EB';

/**
 * Plantilla corporativa única para los correos del sistema.
 * HTML con tablas e inline styles (compatible Outlook/Gmail).
 */
function plantilla({
  titulo,
  saludo,
  parrafos,
  bloqueUsuario,
  botonTexto,
  botonLink,
  avisoCaducidad,
  textoPosterior,
  bloqueSeguridad,
  avisoImportante,
}: {
  titulo: string;
  saludo: string;
  parrafos: string[];
  bloqueUsuario?: { etiqueta: string; valor: string };
  botonTexto: string;
  botonLink: string;
  avisoCaducidad: string;
  textoPosterior?: string;
  bloqueSeguridad: { encabezado: string; texto: string };
  avisoImportante: string;
}): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${GRIS_FONDO};mso-table-lspace:0;mso-table-rspace:0;">
  <tr>
    <td align="center" style="padding:36px 16px;">
      <!-- TARJETA -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:#FFFFFF;border:1px solid ${GRIS_BORDE};border-radius:14px;mso-table-lspace:0;mso-table-rspace:0;">
        <tr>
          <td style="padding:0;">
            <!-- ENCABEZADO INSTITUCIONAL -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${VERDE_CLARO};border-radius:14px 14px 0 0;">
              <tr>
                <td align="center" style="padding:28px 24px 22px 24px;">
                  <p style="margin:0 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:19px;font-weight:700;color:${VERDE_OSCURO};letter-spacing:0.4px;">DUSAKAWI EPSI</p>
                  <p style="margin:3px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;color:${VERDE};letter-spacing:1.6px;text-transform:uppercase;">Sistema de Control de Asistencia</p>
                </td>
              </tr>
            </table>

            <!-- CONTENIDO -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:32px 40px 8px 40px;">
                  <p style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:700;color:${VERDE_OSCURO};line-height:1.3;">${titulo}</p>
                  <p style="margin:0 0 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:#111827;">${saludo}</p>
                </td>
              </tr>

              ${parrafos
                .map(
                  (p, i) => `
              <tr>
                <td style="padding:${i === 0 ? '0' : '10px'} 40px ${i === parrafos.length - 1 ? '0' : '0'} 40px;">
                  <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;color:${GRIS_TEXTO};">${p}</p>
                </td>
              </tr>`
                )
                .join('')}

              ${bloqueUsuario
                ? `
              <tr>
                <td style="padding:22px 40px 4px 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${VERDE_CLARO};border-radius:10px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0 0 3px 0;font-family:Arial,Helvetica,sans-serif;font-size:10.5px;font-weight:700;color:${VERDE};letter-spacing:1.4px;text-transform:uppercase;">${bloqueUsuario.etiqueta}</p>
                        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:${VERDE_OSCURO};">${bloqueUsuario.valor}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`
                : ''}

              <!-- BOTÓN PRINCIPAL (bulletproof para Outlook) -->
              <tr>
                <td align="center" style="padding:26px 40px 8px 40px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="border-radius:9px;background-color:${VERDE_OSCURO};mso-padding-alt:0;">
                        <a href="${botonLink}" target="_blank" style="display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;background-color:${VERDE_OSCURO};padding:14px 32px;border-radius:9px;mso-line-height-rule:exactly;line-height:22px;">
                          ${botonTexto}
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:10px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${GRIS_SUAVE};">${avisoCaducidad}</p>
                </td>
              </tr>

              ${textoPosterior
                ? `
              <tr>
                <td style="padding:14px 40px 0 40px;">
                  <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${GRIS_TEXTO};">${textoPosterior}</p>
                </td>
              </tr>`
                : ''}

              <!-- BLOQUE DE SEGURIDAD -->
              <tr>
                <td style="padding:22px 40px 0 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${GRIS_FONDO};border:1px solid ${GRIS_BORDE};border-radius:10px;">
                    <tr>
                      <td style="padding:14px 18px;">
                        <p style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;font-weight:700;color:#111827;">${bloqueSeguridad.encabezado}</p>
                        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.6;color:${GRIS_TEXTO};">${bloqueSeguridad.texto}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- AVISO IMPORTANTE -->
              <tr>
                <td style="padding:16px 40px 0 40px;">
                  <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;color:${GRIS_TEXTO};">
                    <span style="font-weight:700;color:#B3261E;">Importante:</span> ${avisoImportante}
                  </p>
                </td>
              </tr>
            </table>

            <!-- LÍNEA VERDE + PIE -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:24px 40px 0 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="border-top:3px solid ${VERDE};font-size:1px;line-height:1px;">&nbsp;</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:18px 20px 22px 20px;">
                  <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11.5px;font-weight:700;color:${GRIS_TEXTO};">Dusakawi EPSI &mdash; Sistema de Control de Asistencia</p>
                  <p style="margin:5px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${GRIS_SUAVE};">Este es un mensaje automático. Por favor, no respondas a este correo.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

/** Correo de primer ingreso / activación de cuenta: "Activa tu cuenta de acceso". */
export async function enviarResetPassword({
  email,
  nombre,
  username,
  link,
  primerIngreso = false,
}: EnviarResetPasswordParams): Promise<EmailResult> {
  const t = getTransporter();
  if (!t) {
    console.log('[EMAIL] SMTP no configurado. No se envio correo a', email);
    return { enviado: false, motivo: 'SMTP no configurado' };
  }

  const esPrimerIngreso = primerIngreso;
  const subject = esPrimerIngreso
    ? 'Activa tu cuenta de acceso - Dusakawi EPSI'
    : 'Restablece tu contrasena - Dusakawi EPSI';

  const html = esPrimerIngreso
    ? plantilla({
        titulo: 'Activa tu cuenta de acceso',
        saludo: `Hola, ${nombre}`,
        parrafos: [
          'Tu cuenta de acceso al Sistema de Control de Asistencia de Dusakawi EPSI ha sido creada correctamente.',
          'Para comenzar a utilizar el sistema, establece una contrasena personal y segura.',
        ],
        bloqueUsuario: username ? { etiqueta: 'Usuario', valor: username } : undefined,
        botonTexto: 'Crear mi contrasena',
        botonLink: link,
        avisoCaducidad: 'Este enlace es de un solo uso y estara disponible durante 7 dias.',
        textoPosterior:
          'Una vez establecida tu contrasena, podras ingresar al sistema utilizando tu usuario y la contraseña que hayas configurado.',
        bloqueSeguridad: {
          encabezado: '¿No solicitaste esta cuenta?',
          texto:
            'No realices ninguna accion. Puedes ignorar este correo. ',
        },
        avisoImportante: 'nunca compartas este enlace ni tu contraseña ',
      })
    : plantilla({
        titulo: 'Restablece tu contrasena',
        saludo: `Hola, ${nombre}`,
        parrafos: [
          'Recibimos una solicitud para restablecer tu contrasena en el Sistema de Control de Asistencia de Dusakawi EPSI.',
          'Si fuiste tu quien la solicito, sigue el boton para crear una contrasena nueva y segura.',
        ],
        botonTexto: 'Restablecer contrasena',
        botonLink: link,
        avisoCaducidad: 'Este enlace es de un solo uso y estara disponible durante 30 minutos.',
        textoPosterior:
          'Si no solicitaste este cambio, puedes ignorar este mensaje y tu contrasena actual seguira funcionando.',
        bloqueSeguridad: {
          encabezado: '¿No solicitaste este cambio?',
          texto:
            'No realices ninguna accion. Puedes ignorar este correo. Si consideras que se trata de un error, comunicate con el area de Talento Humano de Dusakawi EPSI.',
        },
        avisoImportante: 'nunca compartas este enlace ni tu contrasena con otras personas.',
      });

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM ?? 'noreply@dusakawiepsi.com',
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
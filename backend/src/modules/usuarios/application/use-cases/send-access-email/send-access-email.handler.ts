import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import type {
  EmailServiceResult,
  ObjetivoAccesoRow,
  ResultadoEnvioAcceso,
  ResultadoEnvioAccesoItem,
} from '@modules/usuarios/domain/entities/usuario';
import type { UsuarioRepository } from '@modules/usuarios/domain/repositories/usuario-repository';

const require = createRequire(import.meta.url);
const { enviarResetPassword } = require('../../../../../services/emailService.js') as {
  enviarResetPassword(input: {
    email: string;
    nombre: string;
    username: string;
    link: string;
    primerIngreso: boolean;
  }): Promise<EmailServiceResult>;
};

export interface SendAccessEmailCommand {
  userIds?: string[];
  todos?: boolean;
}

export type SendAccessEmailResult =
  | { status: 'missing-targets' }
  | ({ status: 'ok' } & ResultadoEnvioAcceso);

function generarUsername(nombre: string, apellido: string, cedula: string | null): string {
  const normalizar = (s: unknown) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const primeraPalabra = (s: unknown) => String(s || '').trim().split(/\s+/)[0] || '';
  const inicial = (normalizar(primeraPalabra(nombre)) || 'u').charAt(0);
  const apellidoNorm = normalizar(apellido || '');
  const primerApellido = (apellidoNorm.split(' ') [0] || '').substring(0, 8);
  const sufijo = String(cedula || '').slice(-3);
  return `${inicial}${primerApellido}${sufijo}`;
}

export class SendAccessEmailHandler {
  constructor(private readonly usuarioRepository: UsuarioRepository) {}

  async handle(command: SendAccessEmailCommand): Promise<SendAccessEmailResult> {
    let targets: ObjetivoAccesoRow[] = [];

    if (command.todos) {
      targets = await this.usuarioRepository.obtenerObjetivosAcceso();
    } else if (Array.isArray(command.userIds) && command.userIds.length) {
      targets = command.userIds.map((id) => ({ id }));
    } else {
      return { status: 'missing-targets' };
    }

    const link = process.env.FRONTEND_URL || 'http://localhost:3000';
    let enviados = 0;
    let fallidos = 0;
    let sin_correo = 0;
    const resultados: ResultadoEnvioAccesoItem[] = [];

    for (const target of targets) {
      const user = await this.usuarioRepository.obtenerUsuarioAcceso(target.id);
      if (!user) {
        fallidos++;
        resultados.push({
          id: target.id,
          nombre: '?',
          username: '?',
          email: '?',
          enviado: false,
          motivo: 'NO ENCONTRADO',
        });
        continue;
      }

      if (!user.email || !user.email.trim()) {
        sin_correo++;
        resultados.push({
          id: user.id,
          nombre: `${user.first_name} ${user.first_surname}`,
          username: user.username,
          email: 'SIN CORREO',
          enviado: false,
          motivo: 'SIN CORREO',
        });
        continue;
      }

      let finalUsername = user.username;

      if (!finalUsername || !finalUsername.trim()) {
        const document = await this.usuarioRepository.obtenerNumeroDocumento(user.id);
        finalUsername = generarUsername(
          user.first_name,
          user.first_surname,
          document?.document_number ?? null,
        );
        let counter = 1;
        while (true) {
          const duplicate = await this.usuarioRepository.existeUsername(finalUsername);
          if (!duplicate) break;
          finalUsername = `${finalUsername}${counter++}`;
        }
      }

      if (!user.password_hash) {
        const password = crypto.randomBytes(32).toString('hex');
        const passwordHash = await bcrypt.hash(password, 10);
        await this.usuarioRepository.actualizarCredencialesAcceso(
          user.id,
          finalUsername,
          passwordHash,
        );
      } else if (finalUsername !== user.username) {
        await this.usuarioRepository.actualizarUsername(user.id, finalUsername);
      }

      await this.usuarioRepository.invalidarPasswordResetTokens(user.id);

      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      await this.usuarioRepository.crearPasswordResetToken(user.id, tokenHash);

      let emailResult: EmailServiceResult | null = null;
      try {
        emailResult = await enviarResetPassword({
          email: user.email,
          nombre: `${user.first_name} ${user.first_surname}`,
          username: finalUsername,
          link: `${link}/restablecer-contrasena?token=${resetToken}`,
          primerIngreso: true,
        });
      } catch {}

      const enviado = !!(emailResult && emailResult.enviado === true);
      if (enviado) {
        enviados++;
      } else {
        fallidos++;
      }

      resultados.push({
        id: user.id,
        nombre: `${user.first_name} ${user.first_surname}`,
        username: finalUsername,
        email: user.email,
        enviado,
        motivo: enviado ? undefined : emailResult?.motivo || 'ENVIO FALLIDO',
      });
    }

    return { status: 'ok', enviados, fallidos, sin_correo, resultados };
  }
}

import type { ResultadoCredencialesMasivas } from '@modules/usuarios/domain/entities/usuario';

export class GenerateUsuariosMasivosHandler {
  async handle(): Promise<ResultadoCredencialesMasivas> {
    return {
      mensaje: 'La generación masiva de credenciales para empleados está deshabilitada en esta versión',
      creados: 0,
      emails_enviados: 0,
      emails_fallados: 0,
      resultados: [],
    };
  }
}

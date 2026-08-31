import type { DomainError } from '@shared/errors/domain.error.js';

interface HttpErrorDescriptor {
  status: number;
  type: string;
  title: string;
}

export class HttpErrorRegistry {
  private readonly descriptors = new Map<string, HttpErrorDescriptor>();

  register(code: string, descriptor: HttpErrorDescriptor): this {
    this.descriptors.set(code, descriptor);
    return this;
  }

  resolve(error: DomainError): HttpErrorDescriptor {
    return (
      this.descriptors.get(error.code) ?? {
        status: 500,
        type: 'https://miapi.com/errors/internal-server-error',
        title: 'Error interno del servidor',
      }
    );
  }
}

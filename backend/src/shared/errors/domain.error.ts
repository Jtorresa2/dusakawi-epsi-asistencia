export abstract class DomainError extends Error {
  abstract readonly code: string;
  readonly metadata?: Record<string, unknown>;

  protected constructor(message: string, metadata?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.metadata = metadata;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

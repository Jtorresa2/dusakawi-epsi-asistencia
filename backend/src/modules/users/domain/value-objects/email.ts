export class Email {
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  private readonly _value: string;

  constructor(value: string) {
    this._value = value;
  }

  static create(value: string): Email {
    const normalizedValue = value.trim();

    if (!this.isValid(normalizedValue)) {
      throw new Error('El correo electrónico es inválido.');
    }

    return new Email(value);
  }

  static isValid(value: string): boolean {
    return value.length !== 0 && this.EMAIL_REGEX.test(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }
}

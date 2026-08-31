import { ValidationError } from '@shared/errors/errors.js';

export class PlainPassword {
  private static readonly PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,128}$/;

  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): PlainPassword {
    const normalizedValue = value.trim();

    if (!this.isValid(normalizedValue)) {
      throw new ValidationError(
        'La contraseña debe tener entre 8 y 128 caracteres, e incluir al menos una mayúscula, una minúscula, un número y un carácter especial.',
      );
    }

    return new PlainPassword(value);
  }

  static isValid(value: string): boolean {
    return value.length !== 0 && this.PASSWORD_REGEX.test(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: PlainPassword): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return '*******';
  }
}

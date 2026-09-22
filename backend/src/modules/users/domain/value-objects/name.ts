import { ValidationError } from '@shared/errors/errors';
import { DataString } from '@shared/value-objects/data-string';

export class Name {
  private static readonly FIRST_LETTER_UPPERCASE_PATTERN = /^[A-ZÀ-Ý]/;
  private readonly _dataString: DataString;

  private constructor(value: string) {
    this._dataString = DataString.create(value);
  }

  static create(value: string): Name {
    const normalizedValue = value.trim();

    if (!this.isFirstLetterUpperCase(normalizedValue)) {
      throw new ValidationError('La primera letra debe ser mayúscula.');
    }

    return new Name(normalizedValue);
  }

  private static isFirstLetterUpperCase(value: string): boolean {
    return this.FIRST_LETTER_UPPERCASE_PATTERN.test(value);
  }

  get value(): string {
    return this._dataString.value;
  }

  equals(other: Name): boolean {
    return this._dataString.equals(other._dataString);
  }
}

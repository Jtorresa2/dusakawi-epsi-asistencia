export class DataString {
  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 255;

  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): DataString {
    if (
      value.length < DataString.MIN_LENGTH ||
      value.length > DataString.MAX_LENGTH
    ) {
      throw new Error(
        `El campo debe tener entre ${DataString.MIN_LENGTH} y ${DataString.MAX_LENGTH} caracteres.`,
      );
    }

    return new DataString(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: DataString): boolean {
    return this._value === other._value;
  }
}

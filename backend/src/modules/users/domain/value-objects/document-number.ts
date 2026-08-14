export class DocumentNumber {
  private static readonly DOCUMENT_NUMBER_REGEX = /^[1-9][0-9]{5,9}$/;
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): DocumentNumber {
    if (!this.DOCUMENT_NUMBER_REGEX.test(value)) {
      throw new Error('El número de documento es inválido.');
    }

    return new DocumentNumber(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: DocumentNumber): boolean {
    return this._value === other._value;
  }
}

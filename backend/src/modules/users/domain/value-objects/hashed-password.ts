export class HashedPassword {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): HashedPassword {
    return new HashedPassword(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: HashedPassword): boolean {
    return this._value === other._value;
  }
}

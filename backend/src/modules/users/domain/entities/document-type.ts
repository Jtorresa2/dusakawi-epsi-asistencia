import { GenericEntity } from '@shared/entities/generic-entity.js';

export const enum DocumentTypeName {
  ID = 'Cédula de ciudadanía',
  FBN = 'Cédula de extranjería',
  MIN = 'Tarjeta de identidad',
  PASS = 'Pasaporte',
}

export class DocumentType extends GenericEntity {
  constructor(public readonly name: DocumentTypeName) {
    super();
  }

  equals(other: DocumentType): boolean {
    return this.name === other.name;
  }
}

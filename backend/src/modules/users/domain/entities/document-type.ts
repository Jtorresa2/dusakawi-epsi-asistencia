import { GenericEntity } from '@shared/entities/generic-entity.js';

export const enum DocumentTypeName {
  CC = 'Cédula de ciudadanía',
  CCE = 'Cédula de extranjería',
}

export class DocumentType extends GenericEntity {
  constructor(public readonly name: DocumentTypeName) {
    super();
  }
}

import type { Metadata } from '@shared/types/metadata.js';

export abstract class GenericEntity {
  public readonly metadata: Metadata;

  protected constructor(metadata?: Metadata | null) {
    this.metadata = metadata ?? {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: null,
    };
  }
}

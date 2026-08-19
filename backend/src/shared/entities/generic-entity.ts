import type { Metadata } from '@shared/types/metadata.js';

export abstract class GenericEntity {
  protected constructor(
    public readonly metadata: Metadata | null = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: null,
    },
  ) {}
}

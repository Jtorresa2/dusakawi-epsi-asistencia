import type { Uuid } from './uuid.js';

export interface Metadata {
  id: Uuid;
  createdAt: Date;
  updatedAt: Date | null;
}

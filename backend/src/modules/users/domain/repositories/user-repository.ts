import type { GenericRepository } from '@shared/repositories/generic-repository.js';
import { User } from '../entities/user.js';

export interface UserRepository extends GenericRepository<User> {
  getUserByUsername(username: string): Promise<User | null>;
  getUserExists(username: string): Promise<boolean>;
  getUserExistsByDocument(documentNumber: string): Promise<boolean>;
}

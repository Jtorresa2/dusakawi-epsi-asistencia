import type { GenericRepository } from '@shared/repositories/generic-repository';
import { User } from '../entities/user';

export interface UserRepository extends GenericRepository<User> {
  getUserByUsername(username: string): Promise<User | null>;
  getUserExists(username: string): Promise<boolean>;
  getUserExistsByDocument(documentNumber: string): Promise<boolean>;
  getUserExistsByEmail(email: string): Promise<boolean>;
}

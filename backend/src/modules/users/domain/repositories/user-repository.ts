import { GenericRepository } from '@shared/repositories/generic-repository.js';
import { User } from '../entities/user.js';

export interface UserRepository extends GenericRepository<User> {
  getUserByUsername(username: string): Promise<User>;
}

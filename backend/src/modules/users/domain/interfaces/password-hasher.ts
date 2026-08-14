import { HashedPassword } from '../value-objects/hashed-password.js';

export interface PasswordHasher {
  hash(password: string): Promise<HashedPassword>;
  verify(password: string, hash: HashedPassword): Promise<boolean>;
}

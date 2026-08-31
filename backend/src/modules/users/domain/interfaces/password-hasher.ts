import { HashedPassword } from '../value-objects/hashed-password.js';
import { PlainPassword } from '../value-objects/plain-password.js';

export interface PasswordHasher {
  hash(password: PlainPassword): Promise<HashedPassword>;
  verify(password: string, hash: HashedPassword): Promise<boolean>;
}

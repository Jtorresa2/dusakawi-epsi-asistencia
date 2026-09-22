import type { HashedPassword } from '@modules/users/domain/value-objects/hashed-password';
import type { PlainPassword } from '@modules/users/domain/value-objects/plain-password';

export interface PasswordHasher {
  hash(password: PlainPassword): Promise<HashedPassword>;
  verify(password: string, hash: HashedPassword): Promise<boolean>;
}

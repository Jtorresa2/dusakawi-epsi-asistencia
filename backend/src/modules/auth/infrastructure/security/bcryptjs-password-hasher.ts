import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '@modules/auth/domain/interfaces/password-hasher';
import type { PlainPassword } from '@modules/users/domain/value-objects/plain-password';
import { HashedPassword } from '@modules/users/domain/value-objects/hashed-password';

export class BcryptjsPasswordHasher implements PasswordHasher {
  private readonly saltRounds = 10;

  async hash(password: PlainPassword): Promise<HashedPassword> {
    const hash = await bcrypt.hash(password.value, this.saltRounds);
    return HashedPassword.create(hash);
  }

  async verify(password: string, hash: HashedPassword): Promise<boolean> {
    return await bcrypt.compare(password, hash.value);
  }
}

import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../../domain/interfaces/password-hasher.js';
import { HashedPassword } from '../../domain/value-objects/hashed-password.js';

export class BcryptjsPasswordHasher implements PasswordHasher {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<HashedPassword> {
    const hash = await bcrypt.hash(password, this.saltRounds);
    return HashedPassword.create(hash);
  }

  async verify(password: string, hash: HashedPassword): Promise<boolean> {
    return await bcrypt.compare(password, hash.value);
  }
}

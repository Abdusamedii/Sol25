import type { SigninInput, SignupInput, User } from '@sol25/shared';
import type { UserRow } from '../../db/schema.js';
import { ConflictError, UnauthorizedError } from '../../lib/errors.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { AuthRepository } from './auth.repository.js';

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async signup(input: SignupInput) {
    const existing = await this.authRepository.findByUsername(input.username);

    if (existing) {
      throw new ConflictError('Username already taken');
    }

    const row = await this.authRepository.create({
      username: input.username,
      passwordHash: hashPassword(input.password),
      role: input.role ?? 'customer',
    });

    if (!row) {
      throw new Error('User creation failed');
    }

    return toUser(row);
  }

  async signin(input: SigninInput) {
    const row = await this.authRepository.findByUsername(input.username);

    if (!row || !verifyPassword(input.password, row.passwordHash)) {
      throw new UnauthorizedError('Invalid username or password');
    }

    return toUser(row);
  }
}

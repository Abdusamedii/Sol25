import { eq } from 'drizzle-orm';
import type { UserRole } from '@sol25/shared';
import type { Database } from '../../db/index.js';
import { users } from '../../db/schema.js';

type CreateUserData = {
  username: string;
  passwordHash: string;
  role: UserRole;
};

export class AuthRepository {
  constructor(private readonly db: Database) {}

  findByUsername(username: string) {
    return this.db.query.users.findFirst({
      where: eq(users.username, username),
    });
  }

  findById(id: string) {
    return this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
  }

  async create(data: CreateUserData) {
    const [user] = await this.db.insert(users).values(data).returning();
    return user;
  }
}

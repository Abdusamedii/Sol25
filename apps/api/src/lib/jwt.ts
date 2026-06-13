import type { UserRole } from '@sol25/shared';

export type JwtUser = {
  sub: string;
  username: string;
  role: UserRole;
};

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtUser;
    user: JwtUser;
  }
}

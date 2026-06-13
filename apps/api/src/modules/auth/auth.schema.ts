import { authResponseSchema, signinSchema, signupSchema, userSchema } from '@sol25/shared';
import type { JwtUser } from '../../lib/jwt.js';

export const signupBodySchema = signupSchema;
export const signinBodySchema = signinSchema;
export const userResponseSchema = userSchema;
export const authSessionResponseSchema = authResponseSchema;

export function toJwtPayload(user: { id: string; username: string; role: JwtUser['role'] }): JwtUser {
  return {
    sub: user.id,
    username: user.username,
    role: user.role,
  };
}

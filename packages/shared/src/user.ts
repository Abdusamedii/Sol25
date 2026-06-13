import { z } from 'zod';

export const userRoleSchema = z.enum(['admin', 'customer']);

export const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(1),
  role: userRoleSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const signupSchema = z.object({
  username: z.string().min(3).max(64),
  password: z.string().min(4).max(128),
  role: userRoleSchema.optional(),
});

export const signinSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type UserRole = z.infer<typeof userRoleSchema>;
export type User = z.infer<typeof userSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;

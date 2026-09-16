import { z } from 'zod';

/** Only shape is checked here: the password policy applies when a password is set, not at login. */
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginDto = z.infer<typeof loginSchema>;

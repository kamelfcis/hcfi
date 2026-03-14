import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  full_name_ar: z.string().min(1).max(200),
  role_id: z.number().int().positive(),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  full_name_ar: z.string().min(1).max(200).optional(),
  role_id: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
});


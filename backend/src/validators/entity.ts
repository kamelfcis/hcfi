import { z } from 'zod';

const optionalEmail = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  z.string().email().optional()
);

export const createEntitySchema = z.object({
  name_ar: z.string().min(1).max(200),
  type: z.enum(['قيادة_عامة', 'فرع_رئيسي', 'قيادة_استراتيجية', 'هيئة_رئيسية', 'إدارة_رئيسية', 'جهة_تابعة']),
  contact_person: z.string().max(200).optional(),
  contact_email: optionalEmail,
  contact_phone: z.string().max(50).optional(),
  address: z.string().optional(),
});

export const updateEntitySchema = z.object({
  name_ar: z.string().min(1).max(200).optional(),
  type: z.enum(['قيادة_عامة', 'فرع_رئيسي', 'قيادة_استراتيجية', 'هيئة_رئيسية', 'إدارة_رئيسية', 'جهة_تابعة']).optional(),
  contact_person: z.string().max(200).optional(),
  contact_email: optionalEmail,
  contact_phone: z.string().max(50).optional(),
  address: z.string().optional(),
  is_active: z.boolean().optional(),
});


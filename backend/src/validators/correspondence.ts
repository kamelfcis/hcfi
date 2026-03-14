import { z } from 'zod';

export const createCorrespondenceSchema = z.object({
  type: z.enum(['incoming', 'outgoing']),
  correspondence_number: z.string().max(100).optional(),
  correspondence_method: z.enum(['hand', 'computer']).optional(),
  subject: z.string().min(1).max(500),
  description: z.string().min(1),
  specialized_branch: z.string().max(255).optional(),
  responsible_person: z.string().max(255).optional(),
  sender_entity_id: z.number().int().positive(),
  receiver_entity_id: z.number().int().positive(),
  correspondence_date: z.string().datetime().or(z.date()),
  current_status: z.enum(['draft', 'sent', 'received', 'under_review', 'replied', 'closed']).optional(),
  storage_location: z.string().max(255).optional(),
});

export const updateCorrespondenceSchema = z.object({
  correspondence_number: z.string().max(100).optional(),
  correspondence_method: z.enum(['hand', 'computer']).optional(),
  subject: z.string().min(1).max(500).optional(),
  description: z.string().min(1).optional(),
  specialized_branch: z.string().max(255).optional(),
  responsible_person: z.string().max(255).optional(),
  sender_entity_id: z.number().int().positive().optional(),
  receiver_entity_id: z.number().int().positive().optional(),
  correspondence_date: z.string().datetime().or(z.date()).optional(),
  current_status: z.enum(['draft', 'sent', 'received', 'under_review', 'replied', 'closed']).optional(),
  review_status: z.enum(['reviewed', 'not_reviewed']).optional(),
  storage_location: z.string().max(255).optional(),
});

export const replySchema = z.object({
  subject: z.string().min(1).max(500),
  body: z.string().min(1),
  parent_reply_id: z.number().int().positive().optional(),
});

export const statusUpdateSchema = z.object({
  status: z.enum(['draft', 'sent', 'received', 'under_review', 'replied', 'closed']),
  notes: z.string().optional(),
});


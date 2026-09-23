import { z } from 'zod';
import { PAGINATION } from '../constants/index';

export const pageQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(PAGINATION.maxSize).default(PAGINATION.defaultSize),
  cursor: z.string().max(512).optional(),
});
export type PageQuery = z.infer<typeof pageQuerySchema>;

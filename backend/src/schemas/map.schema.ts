import { z } from 'zod';

// Query params for GET /api/qsos/map. Both optional ISO YYYY-MM-DD strings; '' is
// allowed and treated as "no filter", preserving prior behavior for ?from= / ?to=.
export const mapQuerySchema = z.object({
  from: z.union([z.iso.date(), z.literal('')]).optional(),
  to: z.union([z.iso.date(), z.literal('')]).optional(),
});

export type MapQuery = z.infer<typeof mapQuerySchema>;

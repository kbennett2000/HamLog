import { z } from 'zod';

export const createContactInfoSchema = z.object({
  callsign: z.string().min(1, 'callsign is required'),
  name: z.string().default(''),
  street: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  addressCountry: z.string().default(''),
  latitude: z.string().default(''),
  longitude: z.string().default(''),
  itu: z.string().default(''),
  grid: z.string().default(''),
  qth: z.string().default(''),
  country: z.string().default(''),
});

export type CreateContactInfoInput = z.infer<typeof createContactInfoSchema>;

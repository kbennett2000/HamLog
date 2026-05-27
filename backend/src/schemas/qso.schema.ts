import { z } from 'zod';

export const createQsoSchema = z.object({
  date: z.string().min(1, 'date is required'),
  time: z.string().default(''),
  callsign: z.string().min(1, 'callsign is required'),
  frequency: z.string().min(1, 'frequency is required'),
  notes: z.string().default(''),
  received: z.string().default(''),
  sent: z.string().default(''),
});

export const createPotaQsoSchema = z.object({
  parkId: z.string().min(1, 'parkId is required'),
  qsoType: z.string().min(1, 'qsoType is required'),
});

export const createContestQsoSchema = z.object({
  contestId: z.string().min(1, 'contestId is required'),
  qsoNumber: z.string().default(''),
  exchangeData: z.string().default(''),
});

export type CreateQsoInput = z.infer<typeof createQsoSchema>;
export type CreatePotaQsoInput = z.infer<typeof createPotaQsoSchema>;
export type CreateContestQsoInput = z.infer<typeof createContestQsoSchema>;

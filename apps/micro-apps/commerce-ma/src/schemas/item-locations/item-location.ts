import { z } from 'zod';

// reorderLevel ("Min. Stock Level") is a TextField string (decimal-pad). Stored as decimal(12,3) → allow
// decimals, must be ≥ 0. Converted to a number when building the mutation input (GraphQL Float).
const reorderLevelField = z
  .string()
  .min(1, 'Required')
  .regex(/^\d+(\.\d+)?$/, 'Enter a valid number')
  .refine((v) => Number(v) >= 0, 'Must be 0 or more');

// CREATE — pick the location + set the reorder level. UPDATE — reorder level only (the location can't change).
export const createItemLocationSchema = z.object({
  locationId: z.string().min(1, 'Select a location').uuid('Select a location'),
  reorderLevel: reorderLevelField,
});

export const updateItemLocationSchema = z.object({
  reorderLevel: reorderLevelField,
});

export type CreateItemLocationFormValues = z.infer<typeof createItemLocationSchema>;
export type UpdateItemLocationFormValues = z.infer<typeof updateItemLocationSchema>;

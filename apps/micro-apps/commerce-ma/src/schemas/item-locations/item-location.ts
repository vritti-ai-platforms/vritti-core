import { z } from '@vritti/quantum-ui-native/zod';

// CREATE — pick the location + set the blocked flag. UPDATE — blocked flag only (the location can't change).
export const createItemLocationSchema = z.object({
  locationId: z.uuid('Select a location'),
  isBlocked: z.boolean(),
});

export const updateItemLocationSchema = z.object({
  isBlocked: z.boolean(),
});

export type CreateItemLocationFormValues = z.infer<typeof createItemLocationSchema>;
export type UpdateItemLocationFormValues = z.infer<typeof updateItemLocationSchema>;

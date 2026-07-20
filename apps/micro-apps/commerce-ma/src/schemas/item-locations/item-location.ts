import { z, zodNumericField } from '@vritti/quantum-ui-native/zod';

// reorderLevel ("Min. Stock Level") is numeric. Stored as decimal(12,3) → allow decimals, must be ≥ 0
// (GraphQL Float).
const reorderLevelField = zodNumericField({ required: 'Min stock level is required', min: 0 });

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

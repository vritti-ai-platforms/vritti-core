import { z, zodCodeField } from '@vritti/quantum-ui-native/zod';

// One schema for create + edit (the sheet edits all three fields). `code` is unique per BU (409 on submit).
export const uomDimensionSchema = z.object({
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
  description: z.string().max(500, 'Description is too long').optional(),
});

export type UomDimensionFormValues = z.infer<typeof uomDimensionSchema>;

import { z, zodNumericField } from '@vritti/quantum-ui-native/zod';

// One schema for create + edit. At least one rate is required (mirrors the web). `isActive` is NOT in the
// schema — it's a plain Checkbox (create is always active; edit toggles it) managed via local state, since
// Checkbox isn't quantum-<Form> name-wirable.
export const taxRateSchema = z.object({
  name: z.string().min(1, 'Rate name is required').max(100, 'Rate name must be 100 characters or fewer'),
  rate: zodNumericField({ required: 'Rate is required', min: 0, max: 100, positive: true, positiveMessage: 'must be > 0' }),
});

export const taxGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
  taxRates: z.array(taxRateSchema).min(1, 'Add at least one tax rate'),
});

export type TaxGroupFormValues = z.infer<typeof taxGroupSchema>;
export type TaxRateFormValues = z.infer<typeof taxRateSchema>;

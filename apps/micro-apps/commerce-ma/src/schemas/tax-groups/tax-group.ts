import { z } from '@vritti/quantum-ui-native/zod';

// One schema for create + edit. Rate is a TextField STRING (decimal-pad) validated as a percentage
// (up to 2 decimals, 0 < rate ≤ 100), converted to Number when building the mutation input. At least one
// rate is required (mirrors the web). `isActive` is NOT in the schema — it's a plain Checkbox (create is
// always active; edit toggles it) managed via local state, since Checkbox isn't quantum-<Form> name-wirable.
export const taxRateSchema = z.object({
  name: z.string().min(1, 'Rate name is required').max(100, 'Rate name must be 100 characters or fewer'),
  rate: z
    .string()
    .min(1, 'Rate is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a percentage (up to 2 decimals)')
    .refine((v) => {
      const n = Number(v);
      return n > 0 && n <= 100;
    }, 'Rate must be between 0 and 100'),
});

export const taxGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
  taxRates: z.array(taxRateSchema).min(1, 'Add at least one tax rate'),
});

export type TaxGroupFormValues = z.infer<typeof taxGroupSchema>;
export type TaxRateFormValues = z.infer<typeof taxRateSchema>;

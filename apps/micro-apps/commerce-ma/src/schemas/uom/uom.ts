import { z } from '@vritti/quantum-ui-native/zod';

// Create/edit a unit. `kind` is UI-only (not persisted): 'base' → baseUnitId null, ratio forced to 1:1;
// 'derived' → requires a base unit + a uomQty:baseUomQty ratio. Qty fields are TextField strings
// (number-pad) validated as positive whole numbers, converted to Int when building the mutation input.
// `allowDecimal` is a plain Checkbox (not a Form-wired field), so it lives outside this schema.
export const uomSchema = z
  .object({
    kind: z.enum(['base', 'derived']),
    name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or fewer'),
    symbol: z.string().min(1, 'Symbol is required').max(10, 'Symbol must be 10 characters or fewer'),
    baseUnitId: z.string().optional(),
    uomQty: z.string().optional(),
    baseUomQty: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.kind !== 'derived') return;
    if (!val.baseUnitId) {
      ctx.addIssue({ code: 'custom', message: 'Select a base unit', path: ['baseUnitId'] });
    }
    if (!val.uomQty || !/^\d+$/.test(val.uomQty) || Number(val.uomQty) < 1) {
      ctx.addIssue({ code: 'custom', message: 'Enter a whole number (1 or more)', path: ['uomQty'] });
    }
    if (!val.baseUomQty || !/^\d+$/.test(val.baseUomQty) || Number(val.baseUomQty) < 1) {
      ctx.addIssue({ code: 'custom', message: 'Enter a whole number (1 or more)', path: ['baseUomQty'] });
    }
  });

export type UomFormValues = z.infer<typeof uomSchema>;

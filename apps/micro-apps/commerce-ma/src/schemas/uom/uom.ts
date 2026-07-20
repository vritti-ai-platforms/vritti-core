import { z, zodNumericField } from '@vritti/quantum-ui-native/zod';

// Create/edit a unit. `kind` is UI-only (not persisted): 'base' → baseUnitId null, ratio forced to 1:1;
// 'derived' → requires a base unit + a uomQty:baseUomQty ratio. Qty fields are numeric whole numbers
// (optional — only used when kind='derived'), converted to Int when building the mutation input.
// `allowDecimal` is a plain Checkbox (not a Form-wired field), so it lives outside this schema.
const positiveInt = zodNumericField({ positive: true, integer: true });

export const uomSchema = z
  .object({
    kind: z.enum(['base', 'derived']),
    name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or fewer'),
    symbol: z.string().min(1, 'Symbol is required').max(10, 'Symbol must be 10 characters or fewer'),
    baseUnitId: z.string().optional(),
    uomQty: positiveInt.optional().catch(undefined),
    baseUomQty: positiveInt.optional().catch(undefined),
  })
  .superRefine((val, ctx) => {
    if (val.kind !== 'derived') return;
    if (!val.baseUnitId) {
      ctx.addIssue({ code: 'custom', message: 'Select a base unit', path: ['baseUnitId'] });
    }
    if (!val.uomQty || val.uomQty <= 0) {
      ctx.addIssue({ code: 'custom', message: 'Count is required', path: ['uomQty'] });
    }
    if (!val.baseUomQty || val.baseUomQty <= 0) {
      ctx.addIssue({ code: 'custom', message: 'Count is required', path: ['baseUomQty'] });
    }
  });

export type UomFormValues = z.infer<typeof uomSchema>;

import { z, zodNumericField } from '@vritti/quantum-ui-native/zod';

// Qty fields are numeric (positive whole numbers ⇒ ≥ 1); the GraphQL inputs are Int.
const qtyField = zodNumericField({ required: 'Value is required', positive: true, integer: true });

// Domain rule (mirrors the commerce-service validation): a conversion is expressed as "1 : N" or "N : 1",
// so exactly one side of the ratio must be 1. Enforce it client-side so the user gets a clear inline error
// instead of a 422 on submit. (Runs only after both qty fields individually pass — zod skips object
// refinements when the shape already has issues.)
const ratioOneSideIsOne = (v: { primaryUomQty: number; uomQty: number }) =>
  v.primaryUomQty === 1 || v.uomQty === 1;
const RATIO_RULE = { message: 'One side of the ratio must be 1 (e.g. 1:10 or 50:1).', path: ['uomQty'] };

// CREATE — pick the alternative UOM + the ratio pair. UPDATE — ratio only (the UOM can't change).
export const createUomConversionSchema = z
  .object({
    uomId: z.string().min(1, 'Select a unit').uuid('Select a unit'),
    primaryUomQty: qtyField,
    uomQty: qtyField,
  })
  .refine(ratioOneSideIsOne, RATIO_RULE);

export const updateUomConversionSchema = z
  .object({
    primaryUomQty: qtyField,
    uomQty: qtyField,
  })
  .refine(ratioOneSideIsOne, RATIO_RULE);

export type CreateUomConversionFormValues = z.infer<typeof createUomConversionSchema>;
export type UpdateUomConversionFormValues = z.infer<typeof updateUomConversionSchema>;

import { z } from 'zod';

const ITEM_CODE_PATTERN = /^[A-Z0-9-]+$/;

const typeEnum = z.enum(['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE']);
const trackingEnum = z.enum(['quantity', 'lot', 'lot_serial', 'serial']);
const pickStrategyEnum = z.enum(['none', 'fifo', 'fefo']);

const nameField = z.string().min(1, 'Name is required').max(255, 'Name is too long');
const codeField = z
  .string()
  .min(1, 'Code is required')
  .max(100, 'Code is too long')
  .regex(ITEM_CODE_PATTERN, 'Use uppercase letters, numbers, and hyphen (-) only');
const descriptionField = z.string().max(500, 'Description is too long');
const hsnCodeField = z.string().max(20, 'HSN code is too long');
const uuidField = z.string().min(1, 'Required').uuid('Enter a valid UUID');

// CREATE — name, code, type, tracking, categoryId, uomId, purchaseTaxGroupId required;
// pickStrategy, description, hsnCode, hasMrp optional (mirrors CreateInventoryItemInput).
export const createInventoryItemSchema = z.object({
  name: nameField,
  code: codeField,
  type: typeEnum,
  tracking: trackingEnum,
  pickStrategy: pickStrategyEnum,
  categoryId: uuidField,
  uomId: uuidField,
  purchaseTaxGroupId: uuidField,
  description: descriptionField,
  hsnCode: hsnCodeField,
  hasMrp: z.boolean(),
});

// UPDATE — all optional EXCEPT purchaseTaxGroupId (required); NO `tracking` field
// (mirrors UpdateInventoryItemInput).
export const updateInventoryItemSchema = z.object({
  name: nameField,
  code: codeField,
  type: typeEnum,
  pickStrategy: pickStrategyEnum,
  categoryId: uuidField,
  uomId: uuidField,
  purchaseTaxGroupId: uuidField,
  description: descriptionField,
  hsnCode: hsnCodeField,
  hasMrp: z.boolean(),
});

export type CreateInventoryItemFormValues = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemFormValues = z.infer<typeof updateInventoryItemSchema>;

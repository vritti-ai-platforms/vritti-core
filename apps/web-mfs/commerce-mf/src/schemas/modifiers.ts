import { z } from 'zod';
import type { ModifierGroupData, ModifierOptionData } from './items';

export const createModifierGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  selectionType: z.enum(['SINGLE', 'MULTI']),
  isRequired: z.boolean(),
  minSelections: z.string(),
  maxSelections: z.string(),
});

export const createModifierOptionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  additionalPrice: z.string().min(1, 'Price is required'),
});

export type CreateModifierGroupFormData = z.infer<typeof createModifierGroupSchema>;
export type CreateModifierOptionFormData = z.infer<typeof createModifierOptionSchema>;

export interface ModifierGroupDetail extends ModifierGroupData {
  options: ModifierOptionData[];
}

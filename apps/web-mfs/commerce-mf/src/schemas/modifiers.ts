import { z, zodNumericField } from '@vritti/quantum-ui/zod';
import type { ModifierGroupData, ModifierOptionData } from './offerings';

export const createModifierGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  selectionType: z.enum(['SINGLE', 'MULTI']),
  isRequired: z.boolean(),
  minSelections: zodNumericField({ required: 'Min selections is required', min: 0 }),
  maxSelections: z.number().nonnegative().optional().catch(undefined),
});

export const createModifierOptionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  additionalPrice: zodNumericField({ required: 'Price is required', min: 0 }),
});

export type CreateModifierGroupFormData = z.infer<typeof createModifierGroupSchema>;
export type CreateModifierOptionFormData = z.infer<typeof createModifierOptionSchema>;

export interface ModifierGroupDetail extends ModifierGroupData {
  options: ModifierOptionData[];
}

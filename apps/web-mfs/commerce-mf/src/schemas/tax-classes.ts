import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCodeField } from '@vritti/quantum-ui/zod';

export const createTaxClassSchema = z.object({
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  isActive: z.boolean(),
});

export const updateTaxClassSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  isActive: z.boolean().optional(),
});

export type CreateTaxClassFormData = z.infer<typeof createTaxClassSchema>;
export type UpdateTaxClassFormData = z.infer<typeof updateTaxClassSchema>;

// `code` is immutable but shown disabled in the edit form, so it belongs to the form type only
export const editTaxClassFormSchema = updateTaxClassSchema.extend({ code: z.string() });
export type EditTaxClassFormData = z.infer<typeof editTaxClassFormSchema>;

export interface TaxClassData {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  isSystem: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TaxClassesTableResponse = TableResponse<TaxClassData>;

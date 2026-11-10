import type { CurrencyAmount } from '@vritti/quantum-ui/format';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCodeField } from '@vritti/quantum-ui/zod';
import type { UpdateTaxClassGroupPayload } from './tax-groups';

export const createTaxClassSchema = z.object({
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  isActive: z.boolean(),
});

export const updateTaxClassSchema = z.object({
  name: z.string({ error: 'Name is required' }).min(1, 'Name is required').max(255),
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

export interface TaxClassGroupInForce {
  taxGroupId: string;
  taxGroupCode: string;
  taxGroupName: string;
  maxUnitPrice: CurrencyAmount | null;
}

export interface TaxClassRowData extends TaxClassData {
  taxGroups: TaxClassGroupInForce[];
}

export type TaxClassesTableResponse = TableResponse<TaxClassRowData>;

export interface CreateTaxClassGroupMappingPayload extends UpdateTaxClassGroupPayload {
  taxGroupId: string;
}

export type UpdateTaxClassGroupMappingPayload = UpdateTaxClassGroupPayload;

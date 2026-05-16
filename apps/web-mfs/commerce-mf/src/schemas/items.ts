import type { TableResponse } from '@vritti/quantum-ui/api-response';
import { z } from '@vritti/quantum-ui/zod';

export const createItemSchema = z.object({
  type: z.enum(['PRODUCT', 'SERVICE']),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  taxGroupId: z.string().optional(),
  isAvailable: z.boolean().optional(),
});

export const updateItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().nullable().optional(),
  taxGroupId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  isAvailable: z.boolean().optional(),
});

export type ItemsTableResponse = TableResponse<ItemData>;

export type CreateItemFormData = z.infer<typeof createItemSchema>;
export type UpdateItemFormData = z.infer<typeof updateItemSchema>;

export type ItemType = 'PRODUCT' | 'SERVICE';

export const ITEM_TYPE_OPTIONS: { value: ItemType; label: string }[] = [
  { value: 'PRODUCT', label: 'Product' },
  { value: 'SERVICE', label: 'Service' },
];

export interface ItemData {
  id: string;
  businessUnitId: string;
  categoryId: string | null;
  categoryName: string | null;
  type: ItemType;
  code: string;
  name: string;
  description: string | null;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ItemOptionValue {
  id: string;
  value: string;
  sortOrder: number;
}

export interface ItemOption {
  id: string;
  name: string;
  sortOrder: number;
  values: ItemOptionValue[];
}

export interface ItemVariant {
  id: string;
  sku: string;
  name: string;
  price: string;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ItemDetail {
  id: string;
  businessUnitId: string;
  categoryId: string | null;
  categoryName: string | null;
  type: ItemType;
  code: string;
  name: string;
  description: string | null;
  taxGroupId: string | null;
  isAvailable: boolean;
  sortOrder: number;
  options: ItemOption[];
  variants: ItemVariant[];
  createdAt: string;
}

export interface OptionInput {
  name: string;
  values: { value: string }[];
}

export interface SaveOptionsPayload {
  options: OptionInput[];
}

export interface UpdateVariantData {
  sku?: string;
  name?: string;
  price?: number | null;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface ModifierOptionData {
  id: string;
  name: string;
  additionalPrice: string;
  isDefault: boolean;
  isAvailable: boolean;
  sortOrder: number;
}

export interface ModifierGroupData {
  id: string;
  businessUnitId: string;
  name: string;
  selectionType: 'SINGLE' | 'MULTI';
  minSelections: number;
  maxSelections: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface ItemModifierGroup {
  id: string;
  name: string;
  selectionType: 'SINGLE' | 'MULTI';
  minSelections: number;
  maxSelections: number | null;
  options: ModifierOptionData[];
}

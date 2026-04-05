import { z } from 'zod';

export const createItemSchema = z.object({
  type: z.enum(['PRODUCT', 'SERVICE']),
  name: z.string().min(1, 'Name is required').max(255),
  categoryId: z.string().optional(),
  basePrice: z.string().min(1, 'Base price is required'),
});

export const updateItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().nullable().optional(),
  basePrice: z.string().optional(),
  costPrice: z.string().nullable().optional(),
  taxGroupId: z.string().nullable().optional(),
  hsnSacCode: z.string().nullable().optional(),
  isVisible: z.boolean().optional(),
  trackInventory: z.boolean().optional(),
  categoryId: z.string().nullable().optional(),
});

export type CreateItemFormData = z.infer<typeof createItemSchema>;
export type UpdateItemFormData = z.infer<typeof updateItemSchema>;

export type ItemType = 'PRODUCT' | 'SERVICE';

export interface ItemData {
  id: string;
  businessUnitId: string;
  categoryId: string | null;
  categoryName: string | null;
  type: ItemType;
  code: string;
  name: string;
  description: string | null;
  basePrice: string;
  costPrice: string | null;
  isAvailable: boolean;
  isVisible: boolean;
  trackInventory: boolean;
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
  price: string | null;
  costPrice: string | null;
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
  basePrice: string;
  costPrice: string | null;
  taxGroupId: string | null;
  hsnSacCode: string | null;
  isAvailable: boolean;
  isVisible: boolean;
  trackInventory: boolean;
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
  costPrice?: number | null;
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

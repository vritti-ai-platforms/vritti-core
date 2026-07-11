import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField } from '@vritti/quantum-ui/zod';

export interface CurrencyAmount {
  currency: string;
  value: string;
}

export type FulfilmentType = 'STOCK' | 'SERVICE' | 'COMPOSITE';

export const FULFILMENT_TYPE_OPTIONS: { value: FulfilmentType; label: string; description?: string }[] = [
  { value: 'STOCK', label: 'Stocked', description: 'Sells an inventory item; depletes stock' },
  { value: 'SERVICE', label: 'Service', description: 'No inventory (labour, fees, etc.)' },
  { value: 'COMPOSITE', label: 'Composite', description: 'Made from a recipe / bill of materials' },
];

export const createOfferingSchema = z.object({
  catalogId: z.string().optional(),
  fulfilmentType: z.enum(['STOCK', 'SERVICE', 'COMPOSITE']),
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  salesTaxGroupId: z.uuid('Sales tax group is required'),
  isAvailable: z.boolean().optional(),
  variantOptionIds: z.array(z.string()).optional(),
  sku: z.string().optional(),
  price: z.object({ currency: z.string(), value: z.string() }).optional(),
  components: z
    .array(
      z.object({
        inventoryItemId: z.string().min(1, 'Select an inventory item'),
        quantity: z.coerce.number().gt(0, 'Quantity must be greater than 0'),
      }),
    )
    .optional(),
});

export const updateOfferingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().nullable().optional(),
  salesTaxGroupId: z.uuid('Sales tax group is required'),
  categoryId: z.string().nullable().optional(),
  isAvailable: z.boolean().optional(),
  variantOptionIds: z.array(z.string()).optional(),
});

export type OfferingsTableResponse = TableResponse<OfferingData>;

export type CreateOfferingFormData = z.infer<typeof createOfferingSchema>;
export type UpdateOfferingFormData = z.infer<typeof updateOfferingSchema>;

export interface OfferingData {
  id: string;
  siteId: string;
  categoryId: string | null;
  categoryName: string | null;
  fulfilmentType: FulfilmentType;
  name: string;
  description: string | null;
  currencyCode: string;
  isAvailable: boolean;
  sortOrder: number;
  modifierGroupCount: number;
  createdAt: string;
}

export interface OfferingOptionValue {
  id: string;
  value: string;
  sortOrder: number;
}

export interface OfferingOption {
  id: string;
  name: string;
  sortOrder: number;
  values: OfferingOptionValue[];
}

export interface OfferingVariantComponent {
  inventoryItemId: string;
  inventoryItemName: string | null;
  quantity: number;
}

export interface OfferingVariant {
  id: string;
  sku: string;
  name: string;
  price: CurrencyAmount;
  optionValueIds: string[];
  components: OfferingVariantComponent[];
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface OfferingDetail {
  id: string;
  siteId: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryPath: string | null;
  fulfilmentType: FulfilmentType;
  name: string;
  description: string | null;
  salesTaxGroupId: string | null;
  currencyCode: string;
  isAvailable: boolean;
  sortOrder: number;
  options: OfferingOption[];
  variants: OfferingVariant[];
  createdAt: string;
}

const variantComponentSchema = z.object({
  inventoryItemId: z.string().min(1, 'Select an inventory item'),
  quantity: z.coerce.number().gt(0, 'Quantity must be greater than 0'),
});

export function buildVariantFormSchema({
  options,
  requireComponents,
}: {
  options: OfferingOption[];
  requireComponents: boolean;
}) {
  const optionShape: Record<string, z.ZodTypeAny> = {};
  for (const option of options) {
    optionShape[option.id] = z.string().optional();
  }

  const base = z.object({
    ...optionShape,
    components: requireComponents
      ? z.array(variantComponentSchema).min(1, 'Add at least one component')
      : z.array(variantComponentSchema).optional(),
    price: zodCurrencyField({ required: 'Price is required', positive: false }),
    isAvailable: z.boolean(),
  });

  if (options.length === 0) return base;

  return base.superRefine((data, ctx) => {
    const hasSelection = options.some((option) => {
      const value = (data as Record<string, unknown>)[option.id];
      return typeof value === 'string' && value.length > 0;
    });
    if (!hasSelection) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select at least one option value',
        path: [options[0].id],
      });
    }
  });
}

export interface VariantComponentInput {
  inventoryItemId: string;
  quantity: number;
}

export interface CreateVariantData {
  optionValueIds: string[];
  components?: VariantComponentInput[];
  price: CurrencyAmount;
  isAvailable: boolean;
  sku?: string;
}

export interface UpdateVariantData {
  sku?: string;
  name?: string;
  price?: CurrencyAmount | null;
  components?: VariantComponentInput[];
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
  siteId: string;
  name: string;
  selectionType: 'SINGLE' | 'MULTI';
  minSelections: number;
  maxSelections: number | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface OfferingModifierGroup {
  id: string;
  name: string;
  selectionType: 'SINGLE' | 'MULTI';
  minSelections: number;
  maxSelections: number | null;
  options: ModifierOptionData[];
}

export const attachModifierSchema = z.object({
  groupId: z.string().min(1, 'Select a modifier group'),
});

export type AttachModifierFormData = z.infer<typeof attachModifierSchema>;

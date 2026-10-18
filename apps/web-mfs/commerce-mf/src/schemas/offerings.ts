import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCodeField, zodNumericField } from '@vritti/quantum-ui/zod';
import type { InventoryItemType, InventoryPickStrategy, InventoryTracking } from '@/schemas/inventory-items';

export const FULFILMENT_TYPES = ['STOCK', 'ASSEMBLY', 'COMPOSITE', 'SERVICE'] as const;
export type FulfilmentType = (typeof FULFILMENT_TYPES)[number];

// What each type means at picking, and what its bill of materials must contain
export const OWNER_SCOPE_LABEL: Record<OfferingOwnerScope, string> = { ORG: 'Org', LE: 'Company', SITE: 'Outlet' };

export const FULFILMENT_TYPE_META: Record<
  FulfilmentType,
  {
    label: string;
    description: string;
    minBomLines: number;
    maxBomLines: number;
    hasInventoryCounterpart: boolean;
  }
> = {
  STOCK: {
    label: 'Stock',
    description: 'Resolves to one stocked item — bought, or produced in advance',
    minBomLines: 1,
    maxBomLines: 1,
    hasInventoryCounterpart: true,
  },
  ASSEMBLY: {
    label: 'Assembly',
    description: 'Made to order — components are consumed and transformed at the point of sale',
    minBomLines: 1,
    maxBomLines: Number.POSITIVE_INFINITY,
    hasInventoryCounterpart: false,
  },
  COMPOSITE: {
    label: 'Composite',
    description: 'Bundled at fulfilment — components stay identifiable, nothing is transformed',
    minBomLines: 1,
    maxBomLines: Number.POSITIVE_INFINITY,
    hasInventoryCounterpart: false,
  },
  SERVICE: {
    label: 'Service',
    description: 'Nothing physical is stocked; components are optional for what it consumes',
    minBomLines: 0,
    maxBomLines: Number.POSITIVE_INFINITY,
    hasInventoryCounterpart: false,
  },
};

// A code becomes a segment of every derived variant code, so it is lowercase-kebab.
export function toCode(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const createOfferingSchema = z.object({
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(255, 'Name cannot exceed 255 characters'),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters'),
  categoryId: z.string().nullable(),
  fulfilmentType: z.enum(FULFILMENT_TYPES),
  taxClassId: z.string().min(1, 'Tax class is required'),
});

export const updateOfferingSchema = z.object({
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(255, 'Name cannot exceed 255 characters'),
  description: z.string().max(2000, 'Description cannot exceed 2000 characters'),
  categoryId: z.string().nullable(),
});

export const setTaxClassSchema = z.object({
  taxClassId: z.string().min(1, 'Tax class is required'),
});

// A custom dimension is created empty; its values are set afterwards from the card
export const createDimensionSchema = z.object({
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters'),
});

// A custom attribute is created empty; its values are set afterwards from the card
export const createAttributeSchema = z.object({
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters'),
});

export const createDimensionFromTemplateSchema = z.object({
  templateId: z.string().min(1, 'Select a template'),
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').nullable(),
  valueCodes: z.array(z.string()).min(1, 'Pick at least one value'),
});

export const createAttributeFromTemplateSchema = z.object({
  templateId: z.string().min(1, 'Select a template'),
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').nullable(),
  valueCodes: z.array(z.string()).min(1, 'Pick at least one value'),
});

export interface DimensionTemplateValueOption {
  code: string;
  value: string;
}

export interface AttributeTemplateValueOption {
  code: string;
  value: string;
}

export const dimensionValueSchema = z.object({
  id: z.string().optional(),
  code: zodCodeField({ max: 50 }),
  value: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
});

export const attributeValueSchema = z.object({
  id: z.string().optional(),
  code: zodCodeField({ max: 50 }),
  value: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
});

export const dimensionValuesSchema = z.object({
  values: z.array(dimensionValueSchema).min(1, 'Add at least one value'),
  templateId: z.string().nullable().optional(),
});

export const attributeValuesSchema = z.object({
  values: z.array(attributeValueSchema).min(1, 'Add at least one value'),
  templateId: z.string().nullable().optional(),
});

// valueIds has no minimum: clearing the attribute across the selection is a legitimate save
export const bulkSetVariantsAttributeSchema = z.object({
  attributeId: z.string().min(1, 'Select an attribute'),
  valueIds: z.array(z.string()),
});

export const updateDimensionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters'),
});

export const updateAttributeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters'),
});

export type CreateOfferingFormData = z.infer<typeof createOfferingSchema>;
export type UpdateOfferingFormData = z.infer<typeof updateOfferingSchema>;
export type SetTaxClassFormData = z.infer<typeof setTaxClassSchema>;
export type CreateDimensionFormData = z.infer<typeof createDimensionSchema>;
export type CreateDimensionFromTemplateFormData = z.infer<typeof createDimensionFromTemplateSchema>;
export type UpdateDimensionFormData = z.infer<typeof updateDimensionSchema>;
export type DimensionValuesFormData = z.infer<typeof dimensionValuesSchema>;
export type CreateAttributeFormData = z.infer<typeof createAttributeSchema>;
export type CreateAttributeFromTemplateFormData = z.infer<typeof createAttributeFromTemplateSchema>;
export type UpdateAttributeFormData = z.infer<typeof updateAttributeSchema>;
export type AttributeValuesFormData = z.infer<typeof attributeValuesSchema>;
export type BulkSetVariantsAttributeFormData = z.infer<typeof bulkSetVariantsAttributeSchema>;

export type OfferingOwnerScope = 'ORG' | 'LE' | 'SITE';

export interface OfferingData {
  id: string;
  code: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  fulfilmentType: FulfilmentType;
  taxClassId: string;
  isActive: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: OfferingOwnerScope;
  ownerName: string;
  dimensionCount: number;
  variantCount: number;
  variantsFollowingTaxClassCount: number;
  variantsMissingBomCount: number;
  canEdit: boolean;
  canMarkActive: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OfferingTableRow = Omit<OfferingData, 'variantsFollowingTaxClassCount' | 'variantsMissingBomCount'>;
export type OfferingsTableResponse = TableResponse<OfferingTableRow>;
export type OfferingVariantsTableResponse = TableResponse<OfferingVariantData>;

export interface DimensionValueData {
  id: string;
  dimensionId: string;
  code: string;
  value: string;
  sortOrder: number;
  canDelete: boolean;
}

export interface AttributeValueData {
  id: string;
  attributeId: string;
  code: string;
  value: string;
  sortOrder: number;
  canDelete: boolean;
}

export interface OfferingDimensionData {
  id: string;
  offeringId: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  values: DimensionValueData[];
  valueCount: number;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OfferingAttributeData {
  id: string;
  offeringId: string;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  values: AttributeValueData[];
  valueCount: number;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VariantValueRefData {
  dimensionId: string;
  dimensionName: string;
  valueId: string;
  value: string;
  valueCode: string;
}

export interface VariantAttributeValueRefData {
  attributeId: string;
  attributeName: string;
  valueId: string;
  value: string;
  valueCode: string;
}

export interface VariantBomData {
  lines: BomLineData[];
  suggestion: { id: string; name: string } | null;
}

export interface BomLineData {
  id: string;
  variantId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemSku: string;
  quantity: number;
  uomId: string;
  uomName: string;
  sortOrder: number;
}

export interface OfferingVariantData {
  id: string;
  offeringId: string;
  code: string;
  externalSku: string | null;
  name: string;
  salesUomId: string;
  salesUomName: string | null;
  isActive: boolean;
  isOfferingActive: boolean;
  sortOrder: number;
  values: VariantValueRefData[];
  attributeValues: VariantAttributeValueRefData[];
  bomLineCount: number;
  canMarkActive: boolean;
  canDelete: boolean;
  taxClassId: string;
  taxClassName: string | null;
  isTaxClassOverridden: boolean;
  fulfilmentType: FulfilmentType;
  isFulfilmentOverridden: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface CreateOfferingData {
  code: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  fulfilmentType: FulfilmentType;
  taxClassId: string;
}

export interface CombinationAxisData {
  dimensionId: string;
  valueIds: string[];
}

export interface PreviewCombinationsData {
  offeringId: string;
  axes: CombinationAxisData[];
}

export interface VariantCombinationData {
  valueIds: string[];
  code: string;
  name: string;
  labels: string;
  exists: boolean;
}

export interface VariantCombinationsData {
  combinations: VariantCombinationData[];
  total: number;
  existingCount: number;
}

export interface CreateDimensionData {
  offeringId: string;
  code: string;
  name: string;
  description: string | null;
}

export interface CreateAttributeData {
  offeringId: string;
  code: string;
  name: string;
  description: string | null;
}

export interface CreateDimensionFromTemplateData {
  offeringId: string;
  templateId: string;
  code: string;
  name: string;
  description: string | null;
  values: DimensionTemplateValueOption[];
}

export interface CreateAttributeFromTemplateData {
  offeringId: string;
  templateId: string;
  code: string;
  name: string;
  description: string | null;
  values: AttributeTemplateValueOption[];
}

// One field per dimension, each optional — a variant carries whichever axes apply to it, so leaving one blank simply
// omits it from the combination and from the derived code
export function buildAddVariantSchema(dimensions: OfferingDimensionData[]) {
  const axes = Object.fromEntries(dimensions.map((dimension) => [dimension.id, z.string()]));
  return z.object({
    ...axes,
    salesUomId: z.string().min(1, 'Unit is required'),
    externalSku: z.string().max(100, 'External SKU cannot exceed 100 characters'),
  });
}

export interface CreateVariantData {
  offeringId: string;
  salesUomId: string;
  valueIds: string[];
  externalSku?: string | null;
}

export interface UpdateDimensionData {
  id: string;
  name: string;
  description: string | null;
}

export interface UpdateAttributeData {
  id: string;
  name: string;
  description: string | null;
}

export interface ReorderDimensionsData {
  offeringId: string;
  dimensionIds: string[];
}

export interface ReorderAttributesData {
  offeringId: string;
  attributeIds: string[];
}

export interface SetOfferingTaxClassData {
  id: string;
  taxClassId: string;
}

export interface SetVariantTaxClassData {
  variantId: string;
  taxClassId: string;
}

export interface SetOfferingFulfilmentData {
  id: string;
  fulfilmentType: FulfilmentType;
}

export interface SetVariantFulfilmentData {
  variantId: string;
  fulfilmentType: FulfilmentType;
}

export interface UpsertDimensionValuesData {
  dimensionId: string;
  values: { id?: string; code: string; value: string }[];
}

export interface UpsertAttributeValuesData {
  attributeId: string;
  values: { id?: string; code: string; value: string }[];
}

export interface SetVariantAttributesData {
  variantId: string;
  valueIds: string[];
}

export interface BulkSetVariantsAttributeData {
  offeringId: string;
  ids: string[];
  attributeId: string;
  valueIds: string[];
}

export interface GenerateVariantsData {
  offeringId: string;
  salesUomId: string;
  combinations: { valueIds: string[] }[];
}

export interface CreateVariantInventoryItemData {
  variantId: string;
  name: string;
  type: InventoryItemType;
  tracking: InventoryTracking;
  pickStrategy?: InventoryPickStrategy;
  categoryId: string;
  uomId: string;
  description?: string | null;
  hsnCode?: string | null;
}

export interface AddBomLineData {
  variantId: string;
  inventoryItemId: string;
  quantity: number;
  uomId: string;
}

export interface UpdateBomLineData {
  variantId: string;
  lineId: string;
  quantity?: number;
  uomId?: string;
}

export interface DeleteBomLineData {
  variantId: string;
  lineId: string;
}

export const editBomLineSchema = z.object({
  quantity: zodNumericField({ required: 'Quantity is required', positive: true }),
  uomId: z.string().min(1, 'Unit is required'),
});

// Which item a line names is fixed once it exists, so only adding asks for it
export const addBomLineSchema = editBomLineSchema.extend({
  inventoryItemId: z.string().min(1, 'Item is required'),
});

export type AddBomLineFormData = z.infer<typeof addBomLineSchema>;
export type EditBomLineFormData = z.infer<typeof editBomLineSchema>;

// Every combination of the selected values, in dimension order — the matrix the wizard reviews The variant code =
// offering code + one value code per dimension, in dimension order.
export function deriveCode(offeringCode: string, dimensions: OfferingDimensionData[], valueIds: string[]): string {
  const codes = dimensions.map((dimension) => {
    const match = dimension.values.find((value) => valueIds.includes(value.id));
    return match?.code ?? '';
  });
  return [offeringCode, ...codes.filter(Boolean)].join('-');
}

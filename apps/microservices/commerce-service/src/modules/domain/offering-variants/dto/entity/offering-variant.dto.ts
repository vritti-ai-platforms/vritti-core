import type { FulfilmentType, OfferingVariant } from '@/db/schema';

export class OfferingVariantValueRefDto {
  dimensionId: string;
  dimensionName: string;
  valueId: string;
  value: string;
  valueCode: string;
}

export class OfferingBomLineDto {
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

export class OfferingVariantDto {
  id: string;
  offeringId: string;
  sku: string;
  externalSku: string | null;
  name: string;
  salesUomId: string;
  salesUomName: string | null;
  taxClassId: string;
  taxClassName: string | null;
  isTaxClassOverridden: boolean;
  fulfilmentType: FulfilmentType;
  isFulfilmentOverridden: boolean;
  isActive: boolean;
  sortOrder: number;
  values: OfferingVariantValueRefDto[];
  bom: OfferingBomLineDto[];
  bomLineCount: number;
  canMarkActive: boolean;
  canDelete: boolean;
  // The inventory item already carrying this variant's SKU, when there is one. Null means the
  // variant has no inventory counterpart yet and may offer to create it.
  // uomId is the item's own stocking unit, so a suggested bill-of-materials line needs no
  // conversion and cannot be rejected for lacking one
  inventoryItem: { id: string; name: string; uomId: string } | null;
  createdAt: string;
  updatedAt: string;

  static from(
    entity: OfferingVariant,
    options: {
      values?: OfferingVariantValueRefDto[];
      bom?: OfferingBomLineDto[];
      bomLineCount?: number;
      salesUomName?: string | null;
      canMarkActive?: boolean;
      canDelete?: boolean;
      taxClassName?: string | null;
      inventoryItem?: { id: string; name: string; uomId: string } | null;
    } = {},
  ): OfferingVariantDto {
    const {
      values = [],
      bom = [],
      bomLineCount = bom.length,
      salesUomName = null,
      canMarkActive = false,
      canDelete = true,
      inventoryItem = null,
      taxClassName = null,
    } = options;
    const dto = new OfferingVariantDto();
    dto.id = entity.id;
    dto.offeringId = entity.offeringId;
    dto.sku = entity.sku;
    dto.externalSku = entity.externalSku ?? null;
    dto.name = entity.name;
    dto.salesUomId = entity.salesUomId;
    dto.salesUomName = salesUomName;
    dto.taxClassId = entity.taxClassId;
    dto.taxClassName = taxClassName;
    dto.isTaxClassOverridden = entity.isTaxClassOverridden;
    dto.fulfilmentType = entity.fulfilmentType;
    dto.isFulfilmentOverridden = entity.isFulfilmentOverridden;
    dto.isActive = entity.isActive;
    dto.sortOrder = entity.sortOrder;
    dto.values = values;
    dto.bom = bom;
    dto.bomLineCount = bomLineCount;
    dto.canMarkActive = canMarkActive;
    dto.canDelete = canDelete;
    dto.inventoryItem = inventoryItem;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

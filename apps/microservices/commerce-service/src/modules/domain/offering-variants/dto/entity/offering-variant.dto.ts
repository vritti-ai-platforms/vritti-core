import type { FulfilmentType, OfferingVariant } from '@/db/schema';

export class OfferingVariantValueRefDto {
  dimensionId: string;
  dimensionName: string;
  valueId: string;
  value: string;
  valueCode: string;
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
  isOfferingActive: boolean;
  values: OfferingVariantValueRefDto[];
  bomLineCount: number;
  canMarkActive: boolean;
  canDelete: boolean;
  // The inventory item already carrying this variant's SKU, when there is one. Null means the
  // variant has no inventory counterpart yet and may offer to create it.
  createdAt: string;
  updatedAt: string;

  // A table row carries no inventory counterpart: it is a SKU-matched join the list read does not run,
  // so the row does not claim "no item exists" when it simply never looked
  static fromTableRow(
    entity: OfferingVariant,
    options: {
      values?: OfferingVariantValueRefDto[];
      bomLineCount?: number;
      salesUomName?: string | null;
      canMarkActive?: boolean;
      canDelete?: boolean;
      taxClassName?: string | null;
    } = {},
  ): OfferingVariantTableRowDto {
    const {
      values = [],
      bomLineCount = 0,
      salesUomName = null,
      canMarkActive = false,
      canDelete = true,
      taxClassName = null,
    } = options;
    return {
      id: entity.id,
      offeringId: entity.offeringId,
      sku: entity.sku,
      externalSku: entity.externalSku ?? null,
      name: entity.name,
      salesUomId: entity.salesUomId,
      salesUomName,
      taxClassId: entity.taxClassId,
      taxClassName,
      isTaxClassOverridden: entity.isTaxClassOverridden,
      fulfilmentType: entity.fulfilmentType,
      isFulfilmentOverridden: entity.isFulfilmentOverridden,
      // Effective sellability, not the raw column: a variant only sells while its own flag AND its
      // offering's are on. isOfferingActive rides along so a caller can say WHY it is off.
      isActive: entity.isActive && entity.isOfferingActive,
      isOfferingActive: entity.isOfferingActive,
      values,
      bomLineCount,
      canMarkActive,
      canDelete,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  static from(
    entity: OfferingVariant,
    options: {
      values?: OfferingVariantValueRefDto[];
      bomLineCount?: number;
      salesUomName?: string | null;
      canMarkActive?: boolean;
      canDelete?: boolean;
      taxClassName?: string | null;
    } = {},
  ): OfferingVariantDto {
    return OfferingVariantDto.fromTableRow(entity, options);
  }
}

// The same row without the SKU-matched item only the detail read joins
export type OfferingVariantTableRowDto = Omit<OfferingVariantDto, 'inventoryItem'>;

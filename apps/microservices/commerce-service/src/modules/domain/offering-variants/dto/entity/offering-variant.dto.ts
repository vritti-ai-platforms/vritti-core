import type { FulfilmentType, OfferingVariant } from '@/db/schema';

export class OfferingVariantValueRefDto {
  dimensionId: string;
  dimensionName: string;
  valueId: string;
  value: string;
  valueCode: string;
}

export class OfferingVariantAttributeValueRefDto {
  attributeId: string;
  attributeName: string;
  valueId: string;
  value: string;
  valueCode: string;
}

export class OfferingVariantDto {
  id: string;
  offeringId: string;
  code: string;
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
  // Several entries may share an attributeId — an attribute is multi-valued, unlike a dimension
  attributeValues: OfferingVariantAttributeValueRefDto[];
  bomLineCount: number;
  canMarkActive: boolean;
  canDelete: boolean;
  // The inventory item already carrying this variant's code, when there is one. Null means the
  // variant has no inventory counterpart yet and may offer to create it.
  createdAt: string;
  updatedAt: string;

  // A table row carries no inventory counterpart: it is a code-matched join the list read does not run,
  // so the row does not claim "no item exists" when it simply never looked
  static fromTableRow(
    entity: OfferingVariant,
    options: {
      values?: OfferingVariantValueRefDto[];
      attributeValues?: OfferingVariantAttributeValueRefDto[];
      bomLineCount?: number;
      salesUomName?: string | null;
      canMarkActive?: boolean;
      canDelete?: boolean;
      taxClassName?: string | null;
    } = {},
  ): OfferingVariantTableRowDto {
    const {
      values = [],
      attributeValues = [],
      bomLineCount = 0,
      salesUomName = null,
      canMarkActive = false,
      canDelete = true,
      taxClassName = null,
    } = options;
    return {
      id: entity.id,
      offeringId: entity.offeringId,
      code: entity.code,
      externalSku: entity.externalSku ?? null,
      name: entity.name,
      salesUomId: entity.salesUomId,
      salesUomName,
      taxClassId: entity.taxClassId,
      taxClassName,
      isTaxClassOverridden: entity.isTaxClassOverridden,
      fulfilmentType: entity.fulfilmentType,
      isFulfilmentOverridden: entity.isFulfilmentOverridden,
      // Effective availability, not the raw column: a variant is only available while its own flag AND its
      // offering's are on. isOfferingActive rides along so a caller can say WHY it is off.
      isActive: entity.isActive && entity.isOfferingActive,
      isOfferingActive: entity.isOfferingActive,
      values,
      attributeValues,
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
      attributeValues?: OfferingVariantAttributeValueRefDto[];
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

// The same row without the code-matched item only the detail read joins
export type OfferingVariantTableRowDto = Omit<OfferingVariantDto, 'inventoryItem'>;

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
  salesUomId: string;
  salesUomName: string;
  taxClassId: string;
  taxClassName: string;
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
  createdAt: string;
  updatedAt: string;

  // A table row carries no inventory counterpart: it is a code-matched join the list read does not run, so the row does
  // not claim "no item exists" when it simply never looked
  static fromTableRow(
    entity: OfferingVariant,
    options: {
      values?: OfferingVariantValueRefDto[];
      attributeValues?: OfferingVariantAttributeValueRefDto[];
      bomLineCount?: number;
      salesUomName: string;
      canMarkActive?: boolean;
      canDelete?: boolean;
      taxClassName: string;
      listed?: boolean;
      availableHere?: boolean;
    },
  ): OfferingVariantTableRowDto {
    const {
      values = [],
      attributeValues = [],
      bomLineCount = 0,
      salesUomName,
      canMarkActive = false,
      canDelete = true,
      taxClassName,
    } = options;
    return {
      id: entity.id,
      offeringId: entity.offeringId,
      code: entity.code,
      externalSku: entity.externalSku ?? null,
      salesUomId: entity.salesUomId,
      salesUomName,
      taxClassId: entity.taxClassId,
      taxClassName,
      isTaxClassOverridden: entity.isTaxClassOverridden,
      fulfilmentType: entity.fulfilmentType,
      isFulfilmentOverridden: entity.isFulfilmentOverridden,
      isActive: entity.isActive && entity.isOfferingActive,
      isOfferingActive: entity.isOfferingActive,
      values,
      attributeValues,
      bomLineCount,
      canMarkActive,
      canDelete,
      ...(options.listed === undefined ? {} : { listed: options.listed }),
      ...(options.availableHere === undefined ? {} : { availableHere: options.availableHere }),
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
      salesUomName: string;
      canMarkActive?: boolean;
      canDelete?: boolean;
      taxClassName: string;
    },
  ): OfferingVariantDto {
    return OfferingVariantDto.fromTableRow(entity, options);
  }
}

export type OfferingVariantTableRowDto = Omit<OfferingVariantDto, 'inventoryItem'> & {
  listed?: boolean;
  availableHere?: boolean;
};

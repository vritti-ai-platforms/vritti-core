import type { FulfilmentType, Offering } from '@/db/schema';

export type OfferingOwnerScope = 'ORG' | 'LE' | 'SITE';

export class OfferingDto {
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
  dimensionCount: number;
  variantCount: number;
  variantsFollowingTaxClassCount: number;
  // Variants with no bill of materials — they cannot be activated until one is added
  variantsMissingBomCount: number;
  canEdit: boolean;
  canMarkActive: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  // A table row carries no tax-class or bill-of-materials counts: both are correlated subqueries the list read
  // does not run, so the row does not claim a number it never measured
  static fromTableRow(
    entity: Offering,
    options: { dimensionCount: number; variantCount: number; isOwned: boolean; canDelete: boolean },
  ): OfferingTableRowDto {
    const { dimensionCount, variantCount, isOwned, canDelete } = options;
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      description: entity.description ?? null,
      categoryId: entity.categoryId ?? null,
      fulfilmentType: entity.fulfilmentType,
      taxClassId: entity.taxClassId,
      isActive: entity.isActive,
      legalEntityId: entity.legalEntityId ?? null,
      siteId: entity.siteId ?? null,
      ownerScope: entity.siteId ? 'SITE' : entity.legalEntityId ? 'LE' : 'ORG',
      dimensionCount,
      variantCount,
      canEdit: isOwned,
      canMarkActive: isOwned && (entity.isActive || variantCount > 0),
      canDelete: isOwned && canDelete,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  // Every count is the caller's to supply. A default would let a read that never measured one report a zero,
  // which reads as "none" rather than "not counted".
  static from(
    entity: Offering,
    options: {
      dimensionCount: number;
      variantCount: number;
      variantsFollowingTaxClassCount: number;
      variantsMissingBomCount: number;
      isOwned: boolean;
      canDelete: boolean;
    },
  ): OfferingDto {
    return {
      ...OfferingDto.fromTableRow(entity, options),
      variantsFollowingTaxClassCount: options.variantsFollowingTaxClassCount,
      variantsMissingBomCount: options.variantsMissingBomCount,
    };
  }
}

// The same row without the two counts only the detail read measures
export type OfferingTableRowDto = Omit<OfferingDto, 'variantsFollowingTaxClassCount' | 'variantsMissingBomCount'>;

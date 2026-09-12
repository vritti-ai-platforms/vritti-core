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
  sortOrder: number;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: OfferingOwnerScope;
  dimensionCount: number;
  variantCount: number;
  // Variants with no bill of materials — they cannot be activated until one is added
  variantsMissingBomCount: number;
  canEdit: boolean;
  canMarkActive: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;

  static from(
    entity: Offering,
    options: {
      dimensionCount?: number;
      variantCount?: number;
      variantsMissingBomCount?: number;
      isOwned?: boolean;
      canDelete?: boolean;
    } = {},
  ): OfferingDto {
    const {
      dimensionCount = 0,
      variantCount = 0,
      variantsMissingBomCount = 0,
      isOwned = false,
      canDelete = false,
    } = options;
    const dto = new OfferingDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.categoryId = entity.categoryId ?? null;
    dto.fulfilmentType = entity.fulfilmentType;
    dto.taxClassId = entity.taxClassId;
    dto.isActive = entity.isActive;
    dto.sortOrder = entity.sortOrder;
    dto.variantsMissingBomCount = variantsMissingBomCount;
    dto.legalEntityId = entity.legalEntityId ?? null;
    dto.siteId = entity.siteId ?? null;
    dto.ownerScope = entity.siteId ? 'SITE' : entity.legalEntityId ? 'LE' : 'ORG';
    dto.dimensionCount = dimensionCount;
    dto.variantCount = variantCount;
    dto.canEdit = isOwned;
    dto.canMarkActive = isOwned && (entity.isActive || variantCount > 0);
    dto.canDelete = isOwned && canDelete;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

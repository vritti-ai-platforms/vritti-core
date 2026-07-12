import type { FulfilmentType, Offering } from '@/db/schema';

export class OfferingDto {
  id: string;
  siteId: string;
  categoryId: string | null;
  categoryName: string | null;
  fulfilmentType: FulfilmentType;
  name: string;
  description: string | null;
  salesTaxGroupId: string | null;
  currencyCode: string;
  isAvailable: boolean;
  sortOrder: number;
  modifierGroupCount: number;
  createdAt: string;
  updatedAt: string;

  // Maps an Offering entity to an OfferingDto
  static from(
    entity: Offering,
    currencyCode: string,
    categoryName?: string | null,
    modifierGroupCount = 0,
  ): OfferingDto {
    const dto = new OfferingDto();
    dto.id = entity.id;
    dto.siteId = entity.siteId;
    dto.currencyCode = currencyCode;
    dto.categoryId = entity.categoryId ?? null;
    dto.categoryName = categoryName ?? null;
    dto.fulfilmentType = entity.fulfilmentType;
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.salesTaxGroupId = entity.salesTaxGroupId ?? null;
    dto.isAvailable = entity.isAvailable;
    dto.sortOrder = entity.sortOrder;
    dto.modifierGroupCount = modifierGroupCount;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

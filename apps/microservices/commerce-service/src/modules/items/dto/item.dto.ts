import type { CatalogItem, CatalogItemType } from '@/db/schema';

export class ItemDto {
  id: string;
  businessUnitId: string;
  categoryId: string | null;
  categoryName: string | null;
  type: CatalogItemType;
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
  createdAt: string;
  updatedAt: string;

  // Maps a CatalogItem entity to an ItemDto
  static from(entity: CatalogItem, categoryName?: string | null): ItemDto {
    const dto = new ItemDto();
    dto.id = entity.id;
    dto.businessUnitId = entity.businessUnitId;
    dto.categoryId = entity.categoryId ?? null;
    dto.categoryName = categoryName ?? null;
    dto.type = entity.type;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.basePrice = entity.basePrice;
    dto.costPrice = entity.costPrice ?? null;
    dto.taxGroupId = entity.taxGroupId ?? null;
    dto.hsnSacCode = entity.hsnSacCode ?? null;
    dto.isAvailable = entity.isAvailable;
    dto.isVisible = entity.isVisible;
    dto.trackInventory = entity.trackInventory;
    dto.sortOrder = entity.sortOrder;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

import type { CatalogItemType, Item } from '@/db/schema';

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
  taxGroupId: string | null;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;

  // Maps an Item entity to an ItemDto
  static from(entity: Item, categoryName?: string | null): ItemDto {
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
    dto.taxGroupId = entity.taxGroupId ?? null;
    dto.isAvailable = entity.isAvailable;
    dto.sortOrder = entity.sortOrder;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

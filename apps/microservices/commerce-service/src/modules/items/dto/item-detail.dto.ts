import type { CatalogItem, CatalogItemType, ItemOption, ItemOptionValue, ItemVariant } from '@/db/schema';

export class ItemOptionValueDto {
  id: string;
  value: string;
  sortOrder: number;

  // Maps an ItemOptionValue entity to a DTO
  static from(entity: ItemOptionValue): ItemOptionValueDto {
    const dto = new ItemOptionValueDto();
    dto.id = entity.id;
    dto.value = entity.value;
    dto.sortOrder = entity.sortOrder;
    return dto;
  }
}

export class ItemOptionDto {
  id: string;
  name: string;
  sortOrder: number;
  values: ItemOptionValueDto[];

  // Maps an ItemOption entity with its values to a DTO
  static from(entity: ItemOption, values: ItemOptionValue[]): ItemOptionDto {
    const dto = new ItemOptionDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.sortOrder = entity.sortOrder;
    dto.values = values.map(ItemOptionValueDto.from);
    return dto;
  }
}

export class ItemVariantDto {
  id: string;
  sku: string;
  name: string;
  price: string | null;
  costPrice: string | null;
  isAvailable: boolean;
  manageInventory: boolean;
  sortOrder: number;
  optionValueIds: string[];
  createdAt: string;
  updatedAt: string;

  // Maps an ItemVariant entity with option value IDs to a DTO
  static from(entity: ItemVariant, optionValueIds: string[]): ItemVariantDto {
    const dto = new ItemVariantDto();
    dto.id = entity.id;
    dto.sku = entity.sku;
    dto.name = entity.name;
    dto.price = entity.price ?? null;
    dto.costPrice = entity.costPrice ?? null;
    dto.isAvailable = entity.isAvailable;
    dto.manageInventory = entity.manageInventory;
    dto.sortOrder = entity.sortOrder;
    dto.optionValueIds = optionValueIds;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class ItemDetailDto {
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
  attributes: unknown;
  metadata: unknown;
  options: ItemOptionDto[];
  variants: ItemVariantDto[];
  createdAt: string;
  updatedAt: string;

  // Maps a CatalogItem entity with related data to a full detail DTO
  static from(
    entity: CatalogItem,
    categoryName: string | null,
    options: ItemOptionDto[],
    variants: ItemVariantDto[],
  ): ItemDetailDto {
    const dto = new ItemDetailDto();
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
    dto.attributes = entity.attributes;
    dto.metadata = entity.metadata;
    dto.options = options;
    dto.variants = variants;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

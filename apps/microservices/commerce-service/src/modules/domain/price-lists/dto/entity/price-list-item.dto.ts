import type { PriceListItem } from '@/db/schema';

export class PriceListItemDto {
  priceListId: string;
  itemVariantId: string;
  itemVariantSku: string;
  itemVariantName: string;
  itemId: string;
  itemName: string;
  basePrice: number;
  categoryName: string | null;
  sortOrder: number;
  isVisible: boolean;
  priceOverride: number | null;
  createdAt: string;
  updatedAt: string;

  static from(
    entity: PriceListItem & {
      itemVariantId: string;
      itemVariantSku: string;
      itemVariantName: string;
      itemId: string;
      itemName: string;
      basePrice: bigint;
      categoryName?: string | null;
    },
  ): PriceListItemDto {
    const dto = new PriceListItemDto();
    dto.priceListId = entity.priceListId;
    dto.itemVariantId = entity.itemVariantId;
    dto.itemVariantSku = entity.itemVariantSku;
    dto.itemVariantName = entity.itemVariantName;
    dto.itemId = entity.itemId;
    dto.itemName = entity.itemName;
    dto.basePrice = Number(entity.basePrice);
    dto.categoryName = entity.categoryName ?? null;
    dto.sortOrder = entity.sortOrder;
    dto.isVisible = entity.isVisible;
    dto.priceOverride = entity.priceOverride != null ? Number(entity.priceOverride) : null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

import type { PriceListItem } from '@/db/schema';

export class PriceListItemDto {
  priceListId: string;
  itemVariantId: string;
  itemVariantSku: string;
  itemVariantName: string;
  itemId: string;
  itemName: string;
  basePrice: string;
  categoryName: string | null;
  sortOrder: number;
  isVisible: boolean;
  priceOverride: string | null;
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
    dto.basePrice = entity.basePrice.toString();
    dto.categoryName = entity.categoryName ?? null;
    dto.sortOrder = entity.sortOrder;
    dto.isVisible = entity.isVisible;
    dto.priceOverride = entity.priceOverride != null ? entity.priceOverride.toString() : null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

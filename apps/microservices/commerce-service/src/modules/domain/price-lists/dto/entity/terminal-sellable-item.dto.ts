export class TerminalSellableItemDto {
  terminalId: string;
  priceListId: string;
  priceListName: string;
  itemVariantId: string;
  itemVariantSku: string;
  itemVariantName: string;
  itemId: string;
  itemName: string;
  basePrice: string;
  categoryName: string | null;
  priceOverride: string | null;
  priority: number;
  sortOrder: number;

  static from(entity: {
    terminalId: string;
    priceListId: string;
    priceListName: string;
    itemVariantId: string;
    itemVariantSku: string;
    itemVariantName: string;
    itemId: string;
    itemName: string;
    basePrice: bigint;
    categoryName: string | null;
    priceOverride: bigint | null;
    priority: number;
    sortOrder: number;
  }): TerminalSellableItemDto {
    const dto = new TerminalSellableItemDto();
    dto.terminalId = entity.terminalId;
    dto.priceListId = entity.priceListId;
    dto.priceListName = entity.priceListName;
    dto.itemVariantId = entity.itemVariantId;
    dto.itemVariantSku = entity.itemVariantSku;
    dto.itemVariantName = entity.itemVariantName;
    dto.itemId = entity.itemId;
    dto.itemName = entity.itemName;
    dto.basePrice = entity.basePrice.toString();
    dto.categoryName = entity.categoryName;
    dto.priceOverride = entity.priceOverride != null ? entity.priceOverride.toString() : null;
    dto.priority = entity.priority;
    dto.sortOrder = entity.sortOrder;
    return dto;
  }
}

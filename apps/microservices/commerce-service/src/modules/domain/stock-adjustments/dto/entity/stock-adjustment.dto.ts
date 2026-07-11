import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { InventoryTracking, StockAdjustment, StockAdjustmentStatus, StockAdjustmentType } from '@/db/schema';

export class StockAdjustmentDto {
  id: string;
  code: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemUomId: string;
  inventoryItemUomSymbol: string;
  inventoryItemTracking: InventoryTracking;
  type: StockAdjustmentType;
  totalQuantity: number; // derived from sum(lines.quantity)
  status: StockAdjustmentStatus;
  reason: string | null;
  // Opening-stock unit cost (site currency, per primary UOM). Null until set / for non-OPENING types.
  unitCost: CurrencyAmountDto | null;
  isPublishable: boolean;
  publishedAt: string | null;
  createdAt: string;

  static from(
    entity: StockAdjustment & {
      inventoryItemName?: string;
      inventoryItemUomId?: string;
      inventoryItemUomSymbol?: string | null;
      inventoryItemTracking: InventoryTracking;
      totalQuantity?: number | string | null;
      isPublishable?: boolean;
    },
    siteCurrencyCode?: string,
  ): StockAdjustmentDto {
    const dto = new StockAdjustmentDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = entity.inventoryItemName ?? '';
    if (!entity.inventoryItemUomSymbol) {
      throw new Error(`Inventory item UOM symbol missing for stock adjustment ${entity.id}`);
    }
    if (!entity.inventoryItemUomId) {
      throw new Error(`Inventory item UOM id missing for stock adjustment ${entity.id}`);
    }
    dto.inventoryItemUomId = entity.inventoryItemUomId;
    dto.inventoryItemUomSymbol = entity.inventoryItemUomSymbol;
    dto.inventoryItemTracking = entity.inventoryItemTracking;
    dto.type = entity.type;
    dto.totalQuantity = Number(entity.totalQuantity ?? 0);
    dto.status = entity.status;
    dto.reason = entity.reason ?? null;
    dto.unitCost =
      entity.unitCost != null && siteCurrencyCode
        ? CurrencyAmountDto.from(BigInt(entity.unitCost as unknown as string), siteCurrencyCode)
        : null;
    dto.isPublishable = Boolean(entity.isPublishable);
    dto.publishedAt = entity.publishedAt?.toISOString() ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }

  static fromEntity(entity: StockAdjustment): StockAdjustmentDto {
    const dto = new StockAdjustmentDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = '';
    dto.inventoryItemUomId = '';
    dto.inventoryItemUomSymbol = '';
    dto.inventoryItemTracking = 'lot';
    dto.type = entity.type;
    dto.totalQuantity = 0;
    dto.status = entity.status;
    dto.reason = entity.reason ?? null;
    dto.unitCost = null;
    dto.isPublishable = false;
    dto.publishedAt = entity.publishedAt?.toISOString() ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}

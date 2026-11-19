import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import {
  type DisplayUnitRatios,
  type InventoryTracking,
  InventoryTrackingValues,
  type StockAdjustment,
  type StockAdjustmentStatus,
  type StockAdjustmentType,
} from '@/db/schema';

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
  displayUnitRatios: DisplayUnitRatios | null;

  static from(
    entity: StockAdjustment & {
      inventoryItemName?: string;
      inventoryItemUomId: string;
      inventoryItemUomSymbol: string;
      inventoryItemTracking: InventoryTracking;
      totalQuantity?: number | string | null;
      isPublishable?: boolean;
      displayUnitRatios: DisplayUnitRatios;
    },
    leCurrencyCode?: string,
  ): StockAdjustmentDto {
    const dto = new StockAdjustmentDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = entity.inventoryItemName ?? '';
    dto.inventoryItemUomId = entity.inventoryItemUomId;
    dto.inventoryItemUomSymbol = entity.inventoryItemUomSymbol;
    dto.inventoryItemTracking = entity.inventoryItemTracking;
    dto.type = entity.type;
    dto.totalQuantity = Number(entity.totalQuantity ?? 0);
    dto.status = entity.status;
    dto.reason = entity.reason ?? null;
    dto.unitCost =
      entity.unitCost != null && leCurrencyCode
        ? CurrencyAmountDto.from(BigInt(entity.unitCost as unknown as string), leCurrencyCode)
        : null;
    dto.isPublishable = Boolean(entity.isPublishable);
    dto.publishedAt = entity.publishedAt?.toISOString() ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.displayUnitRatios = entity.displayUnitRatios;
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
    dto.inventoryItemTracking = InventoryTrackingValues.LOT;
    dto.type = entity.type;
    dto.totalQuantity = 0;
    dto.status = entity.status;
    dto.reason = entity.reason ?? null;
    dto.unitCost = null;
    dto.isPublishable = false;
    dto.publishedAt = entity.publishedAt?.toISOString() ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.displayUnitRatios = null;
    return dto;
  }
}

import type { StockAdjustment, StockAdjustmentStatus, StockAdjustmentType } from '@/db/schema';

export class StockAdjustmentDto {
  id: string;
  code: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemUomSymbol: string;
  inventoryItemTracking: 'quantity' | 'lot' | 'serial' | 'lot_serial';
  type: StockAdjustmentType;
  totalQuantity: number; // derived from sum(lines.quantity)
  status: StockAdjustmentStatus;
  reason: string | null;
  createdById: string;
  isPublishable: boolean;
  metadata: Record<string, unknown>;
  publishedAt: string | null;
  createdAt: string;

  static from(
    entity: StockAdjustment & {
      inventoryItemName?: string;
      inventoryItemUomSymbol?: string | null;
      inventoryItemTracking: 'quantity' | 'lot' | 'serial' | 'lot_serial';
      totalQuantity?: number | string | null;
      isPublishable?: boolean;
    },
  ): StockAdjustmentDto {
    const dto = new StockAdjustmentDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = entity.inventoryItemName ?? '';
    if (!entity.inventoryItemUomSymbol) {
      throw new Error(`Inventory item UOM symbol missing for stock adjustment ${entity.id}`);
    }
    dto.inventoryItemUomSymbol = entity.inventoryItemUomSymbol;
    dto.inventoryItemTracking = entity.inventoryItemTracking;
    dto.type = entity.type;
    dto.totalQuantity = Number(entity.totalQuantity ?? 0);
    dto.status = entity.status;
    dto.reason = entity.reason ?? null;
    dto.createdById = entity.createdById;
    dto.isPublishable = Boolean(entity.isPublishable);
    dto.metadata = (entity.metadata ?? {}) as Record<string, unknown>;
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
    dto.inventoryItemUomSymbol = '';
    dto.inventoryItemTracking = 'lot';
    dto.type = entity.type;
    dto.totalQuantity = 0;
    dto.status = entity.status;
    dto.reason = entity.reason ?? null;
    dto.createdById = entity.createdById;
    dto.isPublishable = false;
    dto.metadata = (entity.metadata ?? {}) as Record<string, unknown>;
    dto.publishedAt = entity.publishedAt?.toISOString() ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}

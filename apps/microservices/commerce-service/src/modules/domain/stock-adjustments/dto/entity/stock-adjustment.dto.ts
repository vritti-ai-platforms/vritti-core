import type { StockAdjustment, StockAdjustmentStatus, StockAdjustmentType } from '@/db/schema';

export class StockAdjustmentDto {
  id: string;
  code: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemUomSymbol: string;
  type: StockAdjustmentType;
  quantity: number;
  status: StockAdjustmentStatus;
  reason: string | null;
  createdById: string;
  createdByFullName: string;
  isPublishable: boolean;
  publishedAt: string | null;
  createdAt: string;

  static from(entity: StockAdjustment & {
    inventoryItemName?: string;
    inventoryItemUomSymbol?: string | null;
    createdByFullName?: string;
  }): StockAdjustmentDto {
    const dto = new StockAdjustmentDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = entity.inventoryItemName ?? '';
    if (!entity.inventoryItemUomSymbol) {
      throw new Error(`Inventory item UOM symbol missing for stock adjustment ${entity.id}`);
    }
    dto.inventoryItemUomSymbol = entity.inventoryItemUomSymbol;
    dto.type = entity.type;
    dto.quantity = Number(entity.quantity);
    dto.status = entity.status;
    dto.reason = entity.reason ?? null;
    dto.createdById = entity.createdById;
    dto.createdByFullName = entity.createdByFullName ?? '';
    dto.isPublishable = Boolean((entity as { isPublishable?: boolean }).isPublishable);
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
    dto.type = entity.type;
    dto.quantity = Number(entity.quantity);
    dto.status = entity.status;
    dto.reason = entity.reason ?? null;
    dto.createdById = entity.createdById;
    dto.createdByFullName = '';
    dto.isPublishable = false;
    dto.publishedAt = entity.publishedAt?.toISOString() ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}

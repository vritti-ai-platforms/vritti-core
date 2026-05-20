import type { StockTransfer } from '@/db/schema';

export class StockTransferDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  fromBuId: string;
  toBuId: string;
  quantity: number;
  status: string;
  requestedBy: string | null;
  receivedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  static from(entity: StockTransfer, itemName?: string | null): StockTransferDto {
    const dto = new StockTransferDto();
    dto.id = entity.id;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = itemName ?? '';
    dto.fromBuId = entity.fromBuId;
    dto.toBuId = entity.toBuId;
    dto.quantity = Number(entity.quantity);
    dto.status = entity.status;
    dto.requestedBy = entity.requestedBy ?? null;
    dto.receivedBy = entity.receivedBy ?? null;
    dto.notes = entity.notes ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

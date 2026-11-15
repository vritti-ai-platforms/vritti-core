import type { StockTransfer } from '@/db/schema';

export class StockTransferDto {
  id: string;
  inventoryItemId: string;
  fromSiteId: string;
  toSiteId: string;
  quantity: number;
  status: string;
  requestedBy: string | null;
  receivedBy: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  static from(entity: StockTransfer): StockTransferDto {
    const dto = new StockTransferDto();
    dto.id = entity.id;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.fromSiteId = entity.fromSiteId;
    dto.toSiteId = entity.toSiteId;
    dto.quantity = entity.quantity;
    dto.status = entity.status;
    dto.requestedBy = entity.requestedBy ?? null;
    dto.receivedBy = entity.receivedBy ?? null;
    dto.notes = entity.notes ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

// A stock transfer as its table lists it, with the item's name
export class StockTransferRowDto extends StockTransferDto {
  inventoryItemName: string;

  // Maps a table row read with the item's name
  static fromRow(row: StockTransfer & { inventoryItemName: string }): StockTransferRowDto {
    const dto = Object.assign(new StockTransferRowDto(), StockTransferDto.from(row));
    dto.inventoryItemName = row.inventoryItemName;
    return dto;
  }
}

import type { DisplayUnitRatios, StockTransfer } from '@/db/schema';

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

// A stock transfer as its table lists it, with the item's name and the figures for its display unit
export class StockTransferRowDto extends StockTransferDto {
  inventoryItemName: string;
  displayUnitRatios: DisplayUnitRatios;

  // Maps a table row read with the item's name and display-unit figures
  static fromRow(
    row: StockTransfer & { inventoryItemName: string; displayUnitRatios: DisplayUnitRatios },
  ): StockTransferRowDto {
    const dto = Object.assign(new StockTransferRowDto(), StockTransferDto.from(row));
    dto.inventoryItemName = row.inventoryItemName;
    dto.displayUnitRatios = row.displayUnitRatios;
    return dto;
  }
}

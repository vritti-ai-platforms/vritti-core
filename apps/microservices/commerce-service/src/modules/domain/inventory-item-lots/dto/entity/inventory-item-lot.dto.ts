import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { DisplayUnitRatios } from '@/db/schema';
import type { InventoryItemLotWithStock } from '../../repositories/inventory-item-lots.repository';

export class InventoryItemLotDto {
  id: string;
  inventoryItemId: string;
  lotNumber: string;
  manufacturingDate: string | null;
  expiryDate: string;
  mrp: CurrencyAmountDto | null;
  stockedQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  createdAt: string;
  updatedAt: string;
  displayUnitRatios: DisplayUnitRatios;

  static from(row: InventoryItemLotWithStock): InventoryItemLotDto {
    const dto = new InventoryItemLotDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.lotNumber = row.lotNumber;
    dto.manufacturingDate = row.manufacturingDate ?? null;
    dto.expiryDate = row.expiryDate;
    dto.mrp = row.mrp != null && row.mrpCurrencyCode ? CurrencyAmountDto.from(row.mrp, row.mrpCurrencyCode) : null;
    dto.stockedQuantity = Number(row.stockedQuantity ?? 0);
    dto.reservedQuantity = Number(row.reservedQuantity ?? 0);
    dto.availableQuantity = dto.stockedQuantity - dto.reservedQuantity;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    dto.displayUnitRatios = row.displayUnitRatios;
    return dto;
  }
}

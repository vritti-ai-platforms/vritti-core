import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { InventoryItemLot } from '@/db/schema';

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

  static from(
    row: InventoryItemLot & {
      stockedQuantity?: string | number | null;
      reservedQuantity?: string | number | null;
    },
    siteCurrencyCode?: string,
  ): InventoryItemLotDto {
    const dto = new InventoryItemLotDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.lotNumber = row.lotNumber;
    dto.manufacturingDate = row.manufacturingDate ?? null;
    dto.expiryDate = row.expiryDate;
    dto.mrp =
      row.mrp != null && siteCurrencyCode
        ? CurrencyAmountDto.from(BigInt(row.mrp as unknown as string), siteCurrencyCode)
        : null;
    dto.stockedQuantity = Number(row.stockedQuantity ?? 0);
    dto.reservedQuantity = Number(row.reservedQuantity ?? 0);
    dto.availableQuantity = dto.stockedQuantity - dto.reservedQuantity;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}

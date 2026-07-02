import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { LocationItemRow } from '../../repositories/inventory-item-quants.repository';

export class LocationItemDto {
  inventoryItemId: string;
  itemName: string;
  itemCode: string;
  uomSymbol: string | null;
  totalQuantity: number;
  availableQuantity: number;
  totalValue: CurrencyAmountDto | null;
  batchCount: number;

  // Maps a grouped per-item row. availableQuantity = total − reserved; totalValue is the summed
  // quant_value (BU minor units) wrapped in CurrencyAmountDto, null when no cost currency is known.
  static from(row: LocationItemRow): LocationItemDto {
    const dto = new LocationItemDto();
    dto.inventoryItemId = row.inventoryItemId;
    dto.itemName = row.itemName;
    dto.itemCode = row.itemCode;
    dto.uomSymbol = row.uomSymbol;
    dto.totalQuantity = row.totalQuantity;
    dto.availableQuantity = row.totalQuantity - row.reservedQuantity;
    dto.totalValue = row.costCurrency ? CurrencyAmountDto.from(row.totalValueMinor, row.costCurrency) : null;
    dto.batchCount = row.batchCount;
    return dto;
  }
}

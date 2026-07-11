import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { LocationItemQuantRow } from '../../repositories/inventory-item-quants.repository';

export class LocationItemQuantDto {
  quantId: string;
  lotNumber: string | null;
  expiryDate: string | null;
  quantity: number;
  availableQuantity: number;
  unitCost: CurrencyAmountDto | null;
  quantValue: CurrencyAmountDto | null;

  // Maps a per-quant breakdown row. availableQuantity = quantity − reserved; unitCost and quantValue
  // are site-currency minor-unit columns wrapped in CurrencyAmountDto, null when no cost currency is known.
  static from(row: LocationItemQuantRow): LocationItemQuantDto {
    const dto = new LocationItemQuantDto();
    dto.quantId = row.quantId;
    dto.lotNumber = row.lotNumber;
    dto.expiryDate = row.expiryDate;
    dto.quantity = row.quantity;
    dto.availableQuantity = row.quantity - row.reservedQuantity;
    dto.unitCost = row.costCurrency ? CurrencyAmountDto.from(row.unitCost, row.costCurrency) : null;
    dto.quantValue = row.costCurrency ? CurrencyAmountDto.from(row.quantValue, row.costCurrency) : null;
    return dto;
  }
}

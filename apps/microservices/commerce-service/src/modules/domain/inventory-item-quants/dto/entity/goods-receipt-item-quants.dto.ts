import { CurrencyAmountDto } from '@vritti/api-sdk';
import Decimal from '@vritti/api-sdk/decimal';
import type { GrItemQuantCostRow } from '../../repositories/inventory-item-quants.repository';

export class GoodsReceiptItemQuantRowDto {
  quantId: string;
  locationName: string | null;
  lotNumber: string | null;
  quantity: number;
  unitCost: CurrencyAmountDto | null;
  totalCost: CurrencyAmountDto | null;
}

export class GoodsReceiptItemQuantsDto {
  rows: GoodsReceiptItemQuantRowDto[];
  currencyCode: string | null;
  grandTotal: CurrencyAmountDto | null;

  // Quants are valued in BU currency (cost_currency). totalCost = unit_cost × quantity, rounded
  // once to minor units; grandTotal sums them.
  static from(rows: GrItemQuantCostRow[]): GoodsReceiptItemQuantsDto {
    const dto = new GoodsReceiptItemQuantsDto();
    let currencyCode: string | null = null;
    let grandTotalMinor = 0n;

    dto.rows = rows.map((r) => {
      const row = new GoodsReceiptItemQuantRowDto();
      row.quantId = r.quantId;
      row.locationName = r.locationName;
      row.lotNumber = r.lotNumber;
      row.quantity = Number(r.quantity ?? 0);
      if (r.costCurrency) {
        currencyCode ??= r.costCurrency;
        const totalMinor = BigInt(new Decimal(r.unitCost.toString()).times(row.quantity).toFixed(0));
        grandTotalMinor += totalMinor;
        row.unitCost = CurrencyAmountDto.from(r.unitCost, r.costCurrency);
        row.totalCost = CurrencyAmountDto.from(totalMinor, r.costCurrency);
      } else {
        row.unitCost = null;
        row.totalCost = null;
      }
      return row;
    });

    dto.currencyCode = currencyCode;
    dto.grandTotal = currencyCode ? CurrencyAmountDto.from(grandTotalMinor, currencyCode) : null;
    return dto;
  }
}

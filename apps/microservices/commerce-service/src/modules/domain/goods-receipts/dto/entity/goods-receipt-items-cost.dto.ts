import { CurrencyAmountDto } from '@vritti/api-sdk';
import Decimal from '@vritti/api-sdk/decimal';
import type { GoodsReceiptItemWithRefs } from '../../repositories/goods-receipt-items.repository';

export class GoodsReceiptItemsCostRowDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  uomSymbol: string;
  quantity: number;
  unitPrice: CurrencyAmountDto | null;
  lineTotal: CurrencyAmountDto | null;
}

export class GoodsReceiptItemsCostDto {
  rows: GoodsReceiptItemsCostRowDto[];
  currencyCode: string | null;
  grandTotal: CurrencyAmountDto | null;

  // Line total = unitPrice (minor) × quantity, rounded once to minor units; grand total sums the
  // line totals. All prices share the GR's single supplier currency.
  static from(items: GoodsReceiptItemWithRefs[]): GoodsReceiptItemsCostDto {
    const dto = new GoodsReceiptItemsCostDto();
    let currencyCode: string | null = null;
    let grandTotalMinor = 0n;

    dto.rows = items.map((item) => {
      const row = new GoodsReceiptItemsCostRowDto();
      row.id = item.id;
      row.inventoryItemId = item.inventoryItemId;
      row.inventoryItemName = item.inventoryItemName ?? '';
      row.uomSymbol = item.inventoryItemUomSymbol ?? '';
      row.quantity = Number(item.quantity ?? 0);

      const unitPriceMinor = item.unitPrice != null ? BigInt(item.unitPrice as unknown as string) : null;
      if (unitPriceMinor != null && item.currencyCode) {
        currencyCode ??= item.currencyCode;
        const lineTotalMinor = BigInt(new Decimal(unitPriceMinor.toString()).times(row.quantity).toFixed(0));
        grandTotalMinor += lineTotalMinor;
        row.unitPrice = CurrencyAmountDto.from(unitPriceMinor, item.currencyCode);
        row.lineTotal = CurrencyAmountDto.from(lineTotalMinor, item.currencyCode);
      } else {
        row.unitPrice = null;
        row.lineTotal = null;
      }
      return row;
    });

    dto.currencyCode = currencyCode;
    dto.grandTotal = currencyCode ? CurrencyAmountDto.from(grandTotalMinor, currencyCode) : null;
    return dto;
  }
}

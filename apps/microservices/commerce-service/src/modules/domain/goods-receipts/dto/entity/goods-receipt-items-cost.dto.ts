import { CurrencyAmountDto } from '@vritti/api-sdk';
import Decimal from '@vritti/api-sdk/decimal';
import type { GoodsReceiptItemWithRefs } from '../../repositories/goods-receipt-items.repository';

export class GoodsReceiptItemsCostRowDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  uomSymbol: string;
  orderedQty: number;
  freeQty: number;
  totalQty: number;
  unitPrice: CurrencyAmountDto | null;
  unitCost: CurrencyAmountDto | null;
  lineTotal: CurrencyAmountDto | null;
}

export class GoodsReceiptItemsCostDto {
  rows: GoodsReceiptItemsCostRowDto[];
  currencyCode: string | null;
  grandTotal: CurrencyAmountDto | null;

  // Line total = unitPrice (minor) × orderedQty (the paid quantity; free units are not billed),
  // rounded once to minor units; grand total sums the line totals. All prices share the GR's
  // single supplier currency.
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
      row.orderedQty = Number(item.orderedQty ?? 0);
      row.freeQty = Number(item.freeQty ?? 0);
      row.totalQty = Number(item.totalQty ?? 0);

      const unitPriceMinor = item.unitPrice != null ? BigInt(item.unitPrice as unknown as string) : null;
      if (unitPriceMinor != null && item.currencyCode) {
        currencyCode ??= item.currencyCode;
        const lineTotalMinor = BigInt(new Decimal(unitPriceMinor.toString()).times(row.orderedQty).toFixed(0));
        grandTotalMinor += lineTotalMinor;
        row.unitPrice = CurrencyAmountDto.from(unitPriceMinor, item.currencyCode);
        row.unitCost =
          item.unitCost != null
            ? CurrencyAmountDto.from(BigInt(item.unitCost as unknown as string), item.currencyCode)
            : null;
        row.lineTotal = CurrencyAmountDto.from(lineTotalMinor, item.currencyCode);
      } else {
        row.unitPrice = null;
        row.unitCost = null;
        row.lineTotal = null;
      }
      return row;
    });

    dto.currencyCode = currencyCode;
    dto.grandTotal = currencyCode ? CurrencyAmountDto.from(grandTotalMinor, currencyCode) : null;
    return dto;
  }
}

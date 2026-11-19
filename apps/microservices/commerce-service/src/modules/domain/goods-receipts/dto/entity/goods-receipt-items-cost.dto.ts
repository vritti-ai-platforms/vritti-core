import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { DisplayUnitRatios } from '@/db/schema';
import type { GoodsReceiptItemCost } from '../../services/goods-receipt-items.service';

export class GoodsReceiptItemCostDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  uomSymbol: string;
  primaryUomSymbol: string;
  acceptedQty: number;
  acceptedPrimaryQty: number;
  unitCost: CurrencyAmountDto;
  value: CurrencyAmountDto;
  displayUnitRatios: DisplayUnitRatios;
}

export class GoodsReceiptItemsCostDto {
  rows: GoodsReceiptItemCostDto[];
  currencyCode: string;
  grandTotal: CurrencyAmountDto;

  static from(costs: GoodsReceiptItemCost[], leCurrencyCode: string): GoodsReceiptItemsCostDto {
    const dto = new GoodsReceiptItemsCostDto();
    dto.rows = costs.map((cost) => ({
      id: cost.item.id,
      inventoryItemId: cost.item.inventoryItemId,
      inventoryItemName: cost.item.inventoryItemName ?? '',
      uomSymbol: cost.item.uomSymbol,
      primaryUomSymbol: cost.item.primaryUomSymbol,
      acceptedQty: cost.acceptedQty,
      acceptedPrimaryQty: cost.acceptedPrimaryQty,
      unitCost: CurrencyAmountDto.from(cost.unitCost, leCurrencyCode),
      value: CurrencyAmountDto.from(cost.value, leCurrencyCode),
      displayUnitRatios: cost.item.displayUnitRatios,
    }));
    dto.currencyCode = leCurrencyCode;
    dto.grandTotal = CurrencyAmountDto.from(
      costs.reduce((total, cost) => total + cost.value, 0n),
      leCurrencyCode,
    );
    return dto;
  }
}

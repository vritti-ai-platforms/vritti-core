import type { CurrencyAmountDto } from '@vritti/api-sdk/money';

export class PurchaseOrderItemDefaultsDto {
  uomId: string | null;
  supplierItemCode: string | null;
  minOrderQuantity: number | null;
  unitPrice: CurrencyAmountDto | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  expectedDeliveryDate: string;
}

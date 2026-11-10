import Decimal from '@vritti/api-sdk/decimal';
import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { PurchaseOrderItemRow } from '../../repositories/purchase-order-items.repository';

export class PurchaseOrderItemDto {
  id: string;
  purchaseOrderId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  expectedDeliveryDate: string;
  inboundDeliveryNumbers: string[];
  inboundDeliveryIds: string[];
  taxDate: string;
  isTaxDateOverridden: boolean;
  isTaxDateLocked: boolean;
  uomId: string;
  orderUomSymbol: string | null;
  uomQty: number;
  expectedFreeQty: number;
  receivedQty: number;
  primaryUomQty: number;
  expectedFreePrimaryQty: number;
  receivedPrimaryQty: number;
  primaryUomSymbol: string | null;
  currencyCode: string;
  unitPrice: CurrencyAmountDto;
  primaryUomUnitPrice: CurrencyAmountDto;
  totalPrice: CurrencyAmountDto;
  sourceUnitPrice: CurrencyAmountDto | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;

  static from(row: PurchaseOrderItemRow): PurchaseOrderItemDto {
    const dto = new PurchaseOrderItemDto();
    // A quantity in the line unit, in the item's primary unit by the line's own ordered-to-primary ratio
    const inPrimary = (qty: number) =>
      row.uomQty === 0 ? 0 : new Decimal(qty).times(row.primaryUomQty).div(row.uomQty).toDecimalPlaces(3).toNumber();
    dto.id = row.id;
    dto.purchaseOrderId = row.purchaseOrderId;
    dto.inventoryItemId = row.inventoryItemId;
    dto.inventoryItemName = row.inventoryItemName ?? '';
    dto.expectedDeliveryDate = row.expectedDeliveryDate;
    dto.inboundDeliveryNumbers = row.inboundDeliveryNumbers;
    dto.inboundDeliveryIds = row.inboundDeliveryIds;
    dto.taxDate = row.taxDate;
    dto.isTaxDateOverridden = row.isTaxDateOverridden;
    dto.isTaxDateLocked = row.isTaxDateLocked;
    dto.uomId = row.uomId;
    dto.orderUomSymbol = row.orderUomSymbol;
    dto.uomQty = row.uomQty;
    dto.expectedFreeQty = row.freeQty;
    dto.receivedQty = row.receivedQuantity;
    dto.primaryUomQty = row.primaryUomQty;
    dto.expectedFreePrimaryQty = inPrimary(row.freeQty);
    dto.receivedPrimaryQty = inPrimary(row.receivedQuantity);
    dto.primaryUomSymbol = row.primaryUomSymbol;
    dto.currencyCode = row.currencyCode;
    dto.unitPrice = CurrencyAmountDto.from(row.unitPrice, row.currencyCode);
    dto.primaryUomUnitPrice = CurrencyAmountDto.from(row.primaryUomUnitPrice, row.currencyCode);
    dto.totalPrice = CurrencyAmountDto.from(row.totalPrice, row.currencyCode);
    dto.sourceUnitPrice =
      row.sourceCurrencyCode && row.sourceUnitPrice !== null
        ? CurrencyAmountDto.from(row.sourceUnitPrice, row.sourceCurrencyCode)
        : null;
    dto.schemeBuyQty = row.schemeBuyQty;
    dto.schemeFreeQty = row.schemeFreeQty;
    dto.hasScheme = row.hasScheme;
    return dto;
  }
}

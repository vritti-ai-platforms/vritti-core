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
  inboundDeliveryDates: string[];
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
  rejectedPrimaryQty: number;
  invoicedPrimaryQty: number;
  returnedPrimaryQty: number;
  cancelledPrimaryQty: number;
  duePrimaryQty: number;
  openToReceivePrimaryQty: number;
  openToInvoicePrimaryQty: number;
  primaryUomSymbol: string | null;
  currencyCode: string;
  unitPrice: CurrencyAmountDto;
  primaryUomUnitPrice: CurrencyAmountDto;
  totalPrice: CurrencyAmountDto;
  sourceUnitPrice: CurrencyAmountDto | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;

  // Shapes a line with its counters; due = ordered + free − cancelled, open to receive = due − received, open to
  // invoice = received − returned − invoiced, all in primary units
  static from(row: PurchaseOrderItemRow): PurchaseOrderItemDto {
    const dto = new PurchaseOrderItemDto();
    // A primary quantity in the line unit, by the line's own ordered-to-primary ratio
    const inLineUnit = (primaryQty: number) =>
      row.primaryUomQty === 0
        ? 0
        : new Decimal(primaryQty).times(row.uomQty).div(row.primaryUomQty).toDecimalPlaces(3).toNumber();
    const due = new Decimal(row.primaryUomQty).plus(row.freePrimaryQty).minus(row.cancelledPrimaryQty);
    dto.id = row.id;
    dto.purchaseOrderId = row.purchaseOrderId;
    dto.inventoryItemId = row.inventoryItemId;
    dto.inventoryItemName = row.inventoryItemName ?? '';
    dto.expectedDeliveryDate = row.expectedDeliveryDate;
    dto.inboundDeliveryNumbers = row.inboundDeliveryNumbers;
    dto.inboundDeliveryIds = row.inboundDeliveryIds;
    dto.inboundDeliveryDates = row.inboundDeliveryDates;
    dto.taxDate = row.taxDate;
    dto.isTaxDateOverridden = row.isTaxDateOverridden;
    dto.isTaxDateLocked = row.isTaxDateLocked;
    dto.uomId = row.uomId;
    dto.orderUomSymbol = row.orderUomSymbol;
    dto.uomQty = row.uomQty;
    dto.expectedFreeQty = inLineUnit(row.freePrimaryQty);
    dto.receivedQty = inLineUnit(row.receivedPrimaryQty);
    dto.primaryUomQty = row.primaryUomQty;
    dto.expectedFreePrimaryQty = row.freePrimaryQty;
    dto.receivedPrimaryQty = row.receivedPrimaryQty;
    dto.rejectedPrimaryQty = row.rejectedPrimaryQty;
    dto.invoicedPrimaryQty = row.invoicedPrimaryQty;
    dto.returnedPrimaryQty = row.returnedPrimaryQty;
    dto.cancelledPrimaryQty = row.cancelledPrimaryQty;
    dto.duePrimaryQty = due.toNumber();
    dto.openToReceivePrimaryQty = Decimal.max(0, due.minus(row.receivedPrimaryQty)).toNumber();
    dto.openToInvoicePrimaryQty = Decimal.max(
      0,
      new Decimal(row.receivedPrimaryQty).minus(row.returnedPrimaryQty).minus(row.invoicedPrimaryQty),
    ).toNumber();
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

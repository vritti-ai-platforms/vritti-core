import Decimal from '@vritti/api-sdk/decimal';
import type { PurchaseOrderReceiptStatus, PurchaseOrderStatus } from '@/db/schema';
import type { InboundDeliveryLineRow } from '../../repositories/inbound-delivery-lines.repository';

export class InboundDeliveryLineDto {
  id: string;
  inboundDeliveryId: string;
  purchaseOrderItemId: string;
  purchaseOrderId: string;
  poNumber: string;
  poStatus: PurchaseOrderStatus;
  poReceiptStatus: PurchaseOrderReceiptStatus;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  uomSymbol: string | null;
  allowDecimal: boolean;
  orderedQty: number;
  poReceivedQty: number;
  quantity: number;
  primaryUomQty: number;
  receivedOnDeliveryQty: number;
  receivedOnDeliveryPrimaryQty: number;
  openQty: number;
  maxQuantity: number;
  createdAt: string;

  // Shapes a line; quantities kept in primary units are shown in the line unit by its PO line's ordered-to-primary ratio
  static from(row: InboundDeliveryLineRow): InboundDeliveryLineDto {
    const inLineUnit = (primaryQty: Decimal.Value) =>
      row.poPrimaryUomQty === 0
        ? 0
        : new Decimal(primaryQty).times(row.poUomQty).div(row.poPrimaryUomQty).toDecimalPlaces(3).toNumber();
    const accepted = new Decimal(row.acceptedOnDeliveryPrimaryQty);
    const dto = new InboundDeliveryLineDto();
    dto.id = row.id;
    dto.inboundDeliveryId = row.inboundDeliveryId;
    dto.purchaseOrderItemId = row.purchaseOrderItemId;
    dto.purchaseOrderId = row.purchaseOrderId;
    dto.poNumber = row.poNumber;
    dto.poStatus = row.poStatus;
    dto.poReceiptStatus = row.poReceiptStatus;
    dto.inventoryItemId = row.inventoryItemId;
    dto.inventoryItemName = row.inventoryItemName ?? '';
    dto.uomId = row.uomId;
    dto.uomSymbol = row.uomSymbol;
    dto.allowDecimal = row.allowDecimal;
    dto.orderedQty = inLineUnit(
      new Decimal(row.poPrimaryUomQty).plus(row.poFreePrimaryQty).minus(row.poCancelledPrimaryQty),
    );
    dto.poReceivedQty = inLineUnit(row.poReceivedPrimaryQty);
    dto.quantity = row.quantity;
    dto.primaryUomQty = row.primaryUomQty;
    dto.receivedOnDeliveryQty = inLineUnit(accepted);
    dto.receivedOnDeliveryPrimaryQty = accepted.toNumber();
    dto.openQty = inLineUnit(Decimal.max(0, new Decimal(row.primaryUomQty).minus(accepted)));
    dto.maxQuantity = inLineUnit(
      Decimal.max(row.primaryUomQty, accepted).plus(Decimal.max(0, row.remainingToDeliverPrimaryQty)),
    );
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}

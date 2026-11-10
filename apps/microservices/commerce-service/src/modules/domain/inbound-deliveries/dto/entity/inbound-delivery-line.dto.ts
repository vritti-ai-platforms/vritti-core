import type { PurchaseOrderStatus } from '@/db/schema';
import type { InboundDeliveryLineRow } from '../../repositories/inbound-delivery-lines.repository';

export class InboundDeliveryLineDto {
  id: string;
  inboundDeliveryId: string;
  purchaseOrderItemId: string;
  purchaseOrderId: string;
  poNumber: string;
  poStatus: PurchaseOrderStatus;
  inventoryItemId: string;
  inventoryItemName: string;
  uomId: string;
  uomSymbol: string | null;
  allowDecimal: boolean;
  orderedQty: number;
  poReceivedQty: number;
  quantity: number;
  receivedOnDeliveryQty: number;
  openQty: number;
  maxQuantity: number;
  createdAt: string;

  static from(row: InboundDeliveryLineRow): InboundDeliveryLineDto {
    const dto = new InboundDeliveryLineDto();
    dto.id = row.id;
    dto.inboundDeliveryId = row.inboundDeliveryId;
    dto.purchaseOrderItemId = row.purchaseOrderItemId;
    dto.purchaseOrderId = row.purchaseOrderId;
    dto.poNumber = row.poNumber;
    dto.poStatus = row.poStatus;
    dto.inventoryItemId = row.inventoryItemId;
    dto.inventoryItemName = row.inventoryItemName ?? '';
    dto.uomId = row.uomId;
    dto.uomSymbol = row.uomSymbol;
    dto.allowDecimal = row.allowDecimal;
    dto.orderedQty = row.orderedQty;
    dto.poReceivedQty = row.poReceivedQty;
    dto.quantity = row.quantity;
    dto.receivedOnDeliveryQty = row.receivedOnDeliveryQty;
    dto.openQty = row.openQty;
    dto.maxQuantity = row.maxQuantity;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}

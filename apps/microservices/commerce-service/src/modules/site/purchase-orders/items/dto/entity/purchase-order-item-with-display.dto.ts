import type { PurchaseOrderItemDto } from '@domain/purchase-order-items/dto/entity/purchase-order-item.dto';
import type { DisplayUomQuantityDto } from '@domain/uom-conversions/dto/entity/display-uom-quantity.dto';

export type PurchaseOrderItemDisplayDto = Record<
  | 'primaryUomQty'
  | 'expectedFreePrimaryQty'
  | 'receivedPrimaryQty'
  | 'rejectedPrimaryQty'
  | 'invoicedPrimaryQty'
  | 'returnedPrimaryQty'
  | 'cancelledPrimaryQty'
  | 'duePrimaryQty'
  | 'openToReceivePrimaryQty'
  | 'openToInvoicePrimaryQty',
  DisplayUomQuantityDto | null
>;

export type PurchaseOrderItemWithDisplayDto = PurchaseOrderItemDto & { display: PurchaseOrderItemDisplayDto };

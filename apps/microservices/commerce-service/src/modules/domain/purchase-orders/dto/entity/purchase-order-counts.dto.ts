import type { PurchaseOrderCounts } from '../../repositories/purchase-orders.repository';

export class PurchaseOrderCountsDto {
  itemCount: number;
  inboundDeliveryCount: number;
  goodsReceiptCount: number;
  invoiceCount: number;

  // Shapes how many lines a purchase order has and how many deliveries, receipts and invoices are on them, one per tab
  static from(row: PurchaseOrderCounts): PurchaseOrderCountsDto {
    const dto = new PurchaseOrderCountsDto();
    dto.itemCount = row.itemCount;
    dto.inboundDeliveryCount = row.inboundDeliveryCount;
    dto.goodsReceiptCount = row.goodsReceiptCount;
    dto.invoiceCount = row.invoiceCount;
    return dto;
  }
}

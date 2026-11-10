// Hand type mirroring the GraphQL GoodsReceipt. `status` is a union (the server field is String — the
// enum-precision caveat in native-graphql.md); a receipt counts lines of one or more purchase orders of its supplier,
// always through an inbound delivery — announced ahead, or created by the receipt itself (`deliverySource`).
export type GoodsReceiptStatus = 'DRAFT' | 'PUBLISHED';

export type InboundDeliverySource = 'ANNOUNCED' | 'RECEIPT';

export interface GoodsReceipt {
  id: string;
  grNumber: string;
  supplierId: string;
  supplierName: string;
  status: GoodsReceiptStatus;
  inboundDeliveryId: string;
  deliveryNumber: string;
  deliverySource: InboundDeliverySource;
  carrier: string | null;
  trackingNumber: string | null;
  supplierDeliveryNoteNumber: string | null;
  supplierDeliveryNoteDate: string | null;
  poNumbers: string[];
  expectedDeliveryDate: string | null;
  receivedDate: string;
  notes: string | null;
  publishedAt: string | null;
  createdAt: string;
}

// Single-GR query result shape (detail screen reads it cache-only).
export interface GoodsReceiptQueryData {
  goodsReceipt: GoodsReceipt | null;
}

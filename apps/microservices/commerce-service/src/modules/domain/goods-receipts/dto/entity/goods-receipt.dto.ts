import type { GoodsReceiptStatus, InboundDeliverySource } from '@/db/schema';
import type { GoodsReceiptRow } from '../../repositories/goods-receipts.repository';

export class GoodsReceiptDto {
  id: string;
  grNumber: string;
  legalEntityId: string;
  siteId: string;
  supplierId: string;
  supplierName: string;
  purchaseId: string | null;
  purchaseNumber: string | null;
  receiveWithInvoiceInvoiceId: string | null;
  status: GoodsReceiptStatus;
  isPostable: boolean;
  itemCount: number;
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
  postedAt: string | null;
  createdAt: string;

  static from(row: GoodsReceiptRow): GoodsReceiptDto {
    const dto = new GoodsReceiptDto();
    dto.id = row.id;
    dto.grNumber = row.grNumber;
    dto.legalEntityId = row.legalEntityId;
    dto.siteId = row.siteId;
    dto.supplierId = row.supplierId;
    dto.supplierName = row.supplierName ?? '';
    dto.purchaseId = row.purchaseId;
    dto.purchaseNumber = row.purchaseNumber;
    dto.receiveWithInvoiceInvoiceId = row.receiveWithInvoiceInvoiceId;
    dto.status = row.status;
    dto.isPostable = row.isPostable;
    dto.itemCount = row.itemCount;
    dto.inboundDeliveryId = row.inboundDeliveryId;
    dto.deliveryNumber = row.deliveryNumber;
    dto.deliverySource = row.deliverySource;
    dto.carrier = row.carrier;
    dto.trackingNumber = row.trackingNumber;
    dto.supplierDeliveryNoteNumber = row.supplierDeliveryNoteNumber;
    dto.supplierDeliveryNoteDate = row.supplierDeliveryNoteDate;
    dto.poNumbers = row.poNumbers;
    dto.expectedDeliveryDate = row.expectedDeliveryDate;
    dto.receivedDate = row.receivedDate;
    dto.notes = row.notes;
    dto.postedAt = row.postedAt?.toISOString() ?? null;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}

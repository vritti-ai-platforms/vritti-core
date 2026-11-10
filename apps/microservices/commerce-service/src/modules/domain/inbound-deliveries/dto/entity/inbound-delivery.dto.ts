import type { InboundDeliverySource, InboundDeliveryStatus } from '@/db/schema';
import type { InboundDeliveryRow } from '../../repositories/inbound-deliveries.repository';

export class InboundDeliveryDto {
  id: string;
  deliveryNumber: string;
  legalEntityId: string;
  siteId: string;
  supplierId: string;
  supplierName: string;
  status: InboundDeliveryStatus;
  source: InboundDeliverySource;
  expectedDeliveryDate: string;
  carrier: string | null;
  trackingNumber: string | null;
  supplierDeliveryNoteNumber: string | null;
  supplierDeliveryNoteDate: string | null;
  notes: string | null;
  lineCount: number;
  poNumbers: string[];
  goodsReceiptCount: number;
  draftGoodsReceiptId: string | null;
  sourceGoodsReceiptId: string | null;
  sourceGrNumber: string | null;
  isEditable: boolean;
  canCancel: boolean;
  canDelete: boolean;
  canReceive: boolean;
  createdAt: string;
  updatedAt: string;

  static from(row: InboundDeliveryRow): InboundDeliveryDto {
    const dto = new InboundDeliveryDto();
    dto.id = row.id;
    dto.deliveryNumber = row.deliveryNumber;
    dto.legalEntityId = row.legalEntityId;
    dto.siteId = row.siteId;
    dto.supplierId = row.supplierId;
    dto.supplierName = row.supplierName ?? '';
    dto.status = row.status;
    dto.source = row.source;
    dto.expectedDeliveryDate = row.expectedDeliveryDate;
    dto.carrier = row.carrier;
    dto.trackingNumber = row.trackingNumber;
    dto.supplierDeliveryNoteNumber = row.supplierDeliveryNoteNumber;
    dto.supplierDeliveryNoteDate = row.supplierDeliveryNoteDate;
    dto.notes = row.notes;
    dto.lineCount = row.lineCount;
    dto.poNumbers = row.poNumbers;
    dto.goodsReceiptCount = row.goodsReceiptCount;
    dto.draftGoodsReceiptId = row.draftGoodsReceiptId;
    dto.sourceGoodsReceiptId = row.sourceGoodsReceiptId;
    dto.sourceGrNumber = row.sourceGrNumber;
    dto.isEditable = row.isEditable;
    dto.canCancel = row.canCancel;
    dto.canDelete = row.canDelete;
    dto.canReceive = row.canReceive;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}

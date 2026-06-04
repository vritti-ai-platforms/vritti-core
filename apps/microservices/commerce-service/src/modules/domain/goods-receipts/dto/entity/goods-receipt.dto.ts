import { CurrencyAmountDto } from '@vritti/api-sdk';
import type { GoodsReceipt } from '@/db/schema';

export class GoodsReceiptDto {
  id: string;
  grNumber: string;
  supplierId: string;
  supplierName: string;
  supplierCurrencyCode: string;
  status: string;
  isPublishable?: boolean;
  canLinkPurchaseOrder?: boolean;
  canUnlinkPurchaseOrder?: boolean;
  po: {
    id: string;
    poNumber: string;
    orderDate: string;
    expectedBy: string | null;
    totalAmount: CurrencyAmountDto;
  } | null;
  receivedDate: string;
  notes: string | null;
  exchangeRate: number;
  publishedAt: string | null;
  createdAt: string;

  static from(
    entity: GoodsReceipt & {
      isPublishable?: boolean;
      canLinkPurchaseOrder?: boolean;
      canUnlinkPurchaseOrder?: boolean;
    },
    refs?: {
      supplierName?: string | null;
      supplierCurrencyCode?: string | null;
      poId?: string | null;
      poNumber?: string | null;
      poOrderDate?: string | null;
      poExpectedBy?: string | null;
      poTotalAmount?: bigint | null;
      poCurrencyCode?: string | null;
    },
  ): GoodsReceiptDto {
    const dto = new GoodsReceiptDto();
    dto.id = entity.id;
    dto.grNumber = entity.grNumber;
    dto.supplierId = entity.supplierId;
    dto.supplierName = refs?.supplierName ?? '';
    dto.supplierCurrencyCode = refs?.supplierCurrencyCode ?? '';
    dto.status = entity.status;
    if (entity.isPublishable !== undefined) dto.isPublishable = entity.isPublishable;
    if (entity.canLinkPurchaseOrder !== undefined) dto.canLinkPurchaseOrder = entity.canLinkPurchaseOrder;
    if (entity.canUnlinkPurchaseOrder !== undefined) dto.canUnlinkPurchaseOrder = entity.canUnlinkPurchaseOrder;
    dto.po =
      refs?.poId && refs?.poNumber
        ? {
            id: refs.poId,
            poNumber: refs.poNumber,
            orderDate: refs.poOrderDate ?? '',
            expectedBy: refs.poExpectedBy ?? null,
            totalAmount: CurrencyAmountDto.from(refs.poTotalAmount ?? 0n, refs.poCurrencyCode ?? 'USD'),
          }
        : null;
    dto.receivedDate = entity.receivedDate;
    dto.notes = entity.notes ?? null;
    dto.exchangeRate = Number(entity.exchangeRate);
    dto.publishedAt = entity.publishedAt?.toISOString() ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}

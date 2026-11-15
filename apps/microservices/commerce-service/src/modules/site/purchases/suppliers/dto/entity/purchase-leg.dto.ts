import type { PurchaseLegRejection } from '@domain/purchase-events/services/purchase-events.service';
import type { PurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/entity/purchase-allocation.dto';
import {
  type PurchaseLegAction,
  PurchaseSupplierDto,
} from '@domain/purchase-suppliers/dto/entity/purchase-supplier.dto';
import type { LegProgress } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import type { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type {
  GoodsReceiptStatus,
  InboundDeliverySource,
  InboundDeliveryStatus,
  PurchaseOrderInvoiceStatus,
  PurchaseOrderReceiptStatus,
  PurchaseOrderStatus,
  SupplierInvoiceStatus,
} from '@/db/schema';
import type { PurchaseLegDocuments } from '@/modules/site/purchase-progress/services/purchase-progress.service';

export class PurchaseLegPurchaseOrderDto {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  receiptStatus: PurchaseOrderReceiptStatus;
  invoiceStatus: PurchaseOrderInvoiceStatus;
  currencyCode: string;
}

export class PurchaseLegDeliveryDto {
  id: string;
  deliveryNumber: string;
  status: InboundDeliveryStatus;
  source: InboundDeliverySource;
  expectedDeliveryDate: string;
  receiptDraftId: string | null;
}

export class PurchaseLegReceiptDto {
  id: string;
  grNumber: string;
  status: GoodsReceiptStatus;
  receivedDate: string;
}

export class PurchaseLegInvoiceDto {
  id: string;
  invoiceNumber: string;
  status: SupplierInvoiceStatus;
  openHoldCount: number;
  isReceiveWithInvoice: boolean;
}

export class PurchaseLegDocumentsDto {
  purchaseOrders: PurchaseLegPurchaseOrderDto[];
  deliveries: PurchaseLegDeliveryDto[];
  receipts: PurchaseLegReceiptDto[];
  invoices: PurchaseLegInvoiceDto[];

  // Shapes the documents of a leg as the chips its card links to their features
  static from(documents: PurchaseLegDocuments): PurchaseLegDocumentsDto {
    const dto = new PurchaseLegDocumentsDto();
    dto.purchaseOrders = documents.purchaseOrders.map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      receiptStatus: po.receiptStatus,
      invoiceStatus: po.invoiceStatus,
      currencyCode: po.currencyCode,
    }));
    dto.deliveries = documents.deliveries.map((delivery) => ({
      id: delivery.id,
      deliveryNumber: delivery.deliveryNumber,
      status: delivery.status,
      source: delivery.source,
      expectedDeliveryDate: delivery.expectedDeliveryDate,
      receiptDraftId: delivery.draftGoodsReceiptId,
    }));
    dto.receipts = documents.receipts.map((receipt) => ({
      id: receipt.id,
      grNumber: receipt.grNumber,
      status: receipt.status,
      receivedDate: receipt.receivedDate,
    }));
    dto.invoices = documents.invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      openHoldCount: invoice.openHoldCount,
      isReceiveWithInvoice: invoice.isReceiveWithInvoice,
    }));
    return dto;
  }
}

export interface PurchaseLegDetails {
  submittedAt: string | null;
  approverUserIds: string[];
  sourcedTotal: CurrencyAmountDto;
  hasUnpricedAllocations: boolean;
  rejection: PurchaseLegRejection | null;
  allocations: PurchaseAllocationDto[];
  documents: PurchaseLegDocumentsDto;
  progress: LegProgress;
  availableActions: PurchaseLegAction[];
}

export class PurchaseLegDto extends PurchaseSupplierDto {
  submittedAt: string | null;
  approverUserIds: string[];
  sourcedTotal: CurrencyAmountDto;
  hasUnpricedAllocations: boolean;
  rejection: PurchaseLegRejection | null;
  allocations: PurchaseAllocationDto[];
  documents: PurchaseLegDocumentsDto;
  progress: LegProgress;
  availableActions: PurchaseLegAction[];

  // Shapes a leg with its allocations, current approvers, last start and rejection, documents, progress and what the
  // caller may do
  static fromLeg(leg: PurchaseSupplierDto, details: PurchaseLegDetails): PurchaseLegDto {
    const dto = Object.assign(new PurchaseLegDto(), leg);
    dto.submittedAt = details.submittedAt;
    dto.approverUserIds = details.approverUserIds;
    dto.sourcedTotal = details.sourcedTotal;
    dto.hasUnpricedAllocations = details.hasUnpricedAllocations;
    dto.rejection = details.rejection;
    dto.allocations = details.allocations;
    dto.documents = details.documents;
    dto.progress = details.progress;
    dto.availableActions = details.availableActions;
    return dto;
  }
}

import type { GoodsReceiptRow } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import type { InboundDeliveryRow } from '@domain/inbound-deliveries/repositories/inbound-deliveries.repository';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { InboundDeliveryLinesDomainService } from '@domain/inbound-deliveries/services/inbound-delivery-lines.service';
import {
  type PurchaseEventAction,
  PurchaseEventActionValues,
  type PurchaseEventDocumentType,
  PurchaseEventDocumentTypeValues,
} from '@domain/purchase-events/dto/entity/purchase-event.dto';
import { PurchaseEventsDomainService } from '@domain/purchase-events/services/purchase-events.service';
import type { PurchaseAllocationRow } from '@domain/purchase-item-allocations/repositories/purchase-item-allocations.repository';
import { PurchaseItemAllocationsDomainService } from '@domain/purchase-item-allocations/services/purchase-item-allocations.service';
import type { PurchaseOrderItemRow } from '@domain/purchase-order-items/repositories/purchase-order-items.repository';
import { PurchaseOrderItemsDomainService } from '@domain/purchase-order-items/services/purchase-order-items.service';
import type { PurchaseOrderRow } from '@domain/purchase-orders/repositories/purchase-orders.repository';
import { PurchaseOrdersDomainService } from '@domain/purchase-orders/services/purchase-orders.service';
import {
  type Leg,
  type LegAdvance,
  type LegFulfilmentFacts,
  PurchaseSuppliersDomainService,
} from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import type { PurchaseRow } from '@domain/purchases/repositories/purchases.repository';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import type { SupplierInvoiceRow } from '@domain/supplier-invoices/repositories/supplier-invoices.repository';
import { SupplierInvoicesDomainService } from '@domain/supplier-invoices/services/supplier-invoices.service';
import { Injectable } from '@nestjs/common';
import Decimal from '@vritti/api-sdk/decimal';
import {
  GoodsReceiptStatusValues,
  InboundDeliverySourceValues,
  type PurchaseLegStep,
  PurchaseLegStepValues,
  PurchaseOrderStatusValues,
  type PurchaseSupplier,
  SupplierInvoiceStatusValues,
} from '@/db/schema';

export interface PurchaseLegDocuments {
  purchaseOrders: PurchaseOrderRow[];
  deliveries: InboundDeliveryRow[];
  receipts: GoodsReceiptRow[];
  invoices: SupplierInvoiceRow[];
}

export interface PurchaseLegFulfilment {
  facts: LegFulfilmentFacts;
  documents: PurchaseLegDocuments;
  orderLines: PurchaseOrderItemRow[];
  remainingByLine: Map<string, number>;
}

export interface PurchaseLegEvent {
  action: PurchaseEventAction;
  documentType?: PurchaseEventDocumentType;
  documentId?: string;
  reason?: string | null;
}

interface PurchaseDocuments {
  allocations: PurchaseAllocationRow[];
  purchaseOrders: PurchaseOrderRow[];
  orderLines: PurchaseOrderItemRow[];
  remainingByLine: Map<string, number>;
  deliveries: InboundDeliveryRow[];
  receipts: GoodsReceiptRow[];
  invoices: SupplierInvoiceRow[];
}

type ProgressLeg = Leg & Pick<PurchaseSupplier, 'supplierId'>;

@Injectable()
export class PurchaseProgressService {
  constructor(
    private readonly purchasesService: PurchasesDomainService,
    private readonly legsService: PurchaseSuppliersDomainService,
    private readonly allocationsService: PurchaseItemAllocationsDomainService,
    private readonly eventsService: PurchaseEventsDomainService,
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly purchaseOrderItemsService: PurchaseOrderItemsDomainService,
    private readonly deliveriesService: InboundDeliveriesDomainService,
    private readonly deliveryLinesService: InboundDeliveryLinesDomainService,
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly invoicesService: SupplierInvoicesDomainService,
  ) {}

  // Gathers each leg's documents and the facts its step and actions derive from, in the order of the given legs
  async findFulfilment(purchase: PurchaseRow, legs: ProgressLeg[]): Promise<PurchaseLegFulfilment[]> {
    const documents = await this.findDocuments(purchase.id);
    const fulfilment: PurchaseLegFulfilment[] = [];
    for (const leg of legs) fulfilment.push(await this.legFulfilment(purchase, leg, documents));
    return fulfilment;
  }

  // Gathers one leg's documents and fulfilment facts
  async findLegFulfilment(purchase: PurchaseRow, leg: ProgressLeg): Promise<PurchaseLegFulfilment> {
    const [fulfilment] = await this.findFulfilment(purchase, [leg]);
    return fulfilment;
  }

  // Records a leg event and re-derives the leg's step from its documents, in the caller's transaction; a leg that is now
  // received and invoiced closes and the purchase completes once every leg is closed
  async recordLegEvent(
    purchase: PurchaseRow,
    leg: ProgressLeg,
    event: PurchaseLegEvent,
    actorId: string | null,
  ): Promise<LegAdvance> {
    const { facts } = await this.findLegFulfilment(purchase, leg);
    const advance = await this.legsService.advance(leg, facts);
    await this.eventsService.record({
      purchaseId: purchase.id,
      purchaseSupplierId: leg.id,
      ...event,
      stepBefore: advance.stepBefore,
      stepAfter: advance.stepAfter,
      actorId,
    });
    if (advance.isClosed) await this.recordLegClosed(purchase, leg, advance.stepBefore, null, actorId);
    return advance;
  }

  // Records a leg closing and completes the purchase once every leg is closed, in the caller's transaction
  async recordLegClosed(
    purchase: PurchaseRow,
    leg: ProgressLeg,
    stepBefore: PurchaseLegStep,
    reason: string | null,
    actorId: string | null,
  ): Promise<void> {
    await this.eventsService.record({
      purchaseId: purchase.id,
      purchaseSupplierId: leg.id,
      action: PurchaseEventActionValues.CLOSE_SUPPLIER,
      stepBefore,
      stepAfter: PurchaseLegStepValues.CLOSED,
      reason,
      actorId,
    });
    const legs = await this.legsService.findByPurchaseId(purchase.id);
    const isCompleted = await this.purchasesService.completeIfLegsClosed(purchase, this.legsService.allClosed(legs));
    if (!isCompleted) return;
    await this.eventsService.record({
      purchaseId: purchase.id,
      action: PurchaseEventActionValues.COMPLETE,
      stepBefore: purchase.step,
      actorId,
    });
  }

  // Tells a purchase that one of its documents was completed in its own feature, in the caller's transaction: records
  // the event on the supplier's leg and re-derives the leg's step
  async notifyDocument(
    purchaseId: string,
    supplierId: string,
    event: PurchaseLegEvent,
    actorId: string | null,
  ): Promise<void> {
    const purchase = await this.purchasesService.findDetailOrThrow(purchaseId);
    const leg = await this.legsService.findForSupplier(purchase.id, supplierId);
    if (!leg) return;
    await this.recordLegEvent(purchase, leg, event, actorId);
  }

  // Tells every purchase an invoice invoices that it was posted or cancelled, in the caller's transaction
  async notifyInvoice(
    invoice: Pick<SupplierInvoiceRow, 'id' | 'supplierId' | 'purchases'>,
    action: PurchaseEventAction,
    actorId: string | null,
  ): Promise<void> {
    for (const purchase of invoice.purchases) {
      await this.notifyDocument(
        purchase.id,
        invoice.supplierId,
        { action, documentType: PurchaseEventDocumentTypeValues.SUPPLIER_INVOICE, documentId: invoice.id },
        actorId,
      );
    }
  }

  // Loads every document a purchase created or its lines invoice, with the lines of its live POs and what they still have
  // free to deliver
  private async findDocuments(purchaseId: string): Promise<PurchaseDocuments> {
    const [allocations, purchaseOrders, deliveries, receipts, invoices] = await Promise.all([
      this.allocationsService.findByPurchaseId(purchaseId),
      this.purchaseOrdersService.findForPurchase(purchaseId),
      this.deliveriesService.findForPurchase(purchaseId),
      this.goodsReceiptsService.findForPurchase(purchaseId),
      this.invoicesService.findForPurchase(purchaseId),
    ]);
    const liveOrderIds = purchaseOrders
      .filter((po) => po.status !== PurchaseOrderStatusValues.CANCELLED)
      .map((po) => po.id);
    const orderLines = await this.purchaseOrderItemsService.findRowsByPurchaseOrderIds(liveOrderIds);
    const remainingByLine = await this.deliveryLinesService.findRemainingToDeliver(orderLines.map((line) => line.id));
    return { allocations, purchaseOrders, orderLines, remainingByLine, deliveries, receipts, invoices };
  }

  // Narrows a purchase's documents to one leg (its supplier) and works out the facts its step and actions derive from
  private async legFulfilment(
    purchase: PurchaseRow,
    leg: ProgressLeg,
    documents: PurchaseDocuments,
  ): Promise<PurchaseLegFulfilment> {
    const ofSupplier = <T extends { supplierId: string }>(rows: T[]) =>
      rows.filter((row) => row.supplierId === leg.supplierId);
    const purchaseOrders = ofSupplier(documents.purchaseOrders);
    const liveOrders = purchaseOrders.filter((po) => po.status !== PurchaseOrderStatusValues.CANCELLED);
    const statusByOrder = new Map(liveOrders.map((po) => [po.id, po.status]));
    const orderLines = documents.orderLines.filter((line) => statusByOrder.has(line.purchaseOrderId));
    const deliveries = ofSupplier(documents.deliveries);
    const receipts = ofSupplier(documents.receipts);
    const invoices = ofSupplier(documents.invoices);

    const facts: LegFulfilmentFacts = {
      allocations: documents.allocations.filter((allocation) => allocation.purchaseSupplierId === leg.id),
      purchaseOrderStatuses: liveOrders.map((po) => po.status),
      orderLines: orderLines.flatMap((line) => {
        const purchaseOrderStatus = statusByOrder.get(line.purchaseOrderId);
        if (!purchaseOrderStatus) return [];
        return [
          {
            purchaseOrderStatus,
            primaryUomQty: line.primaryUomQty,
            freePrimaryQty: line.freePrimaryQty,
            cancelledPrimaryQty: line.cancelledPrimaryQty,
            receivedPrimaryQty: line.receivedPrimaryQty,
            returnedPrimaryQty: line.returnedPrimaryQty,
            invoicedPrimaryQty: line.invoicedPrimaryQty,
            remainingToDeliverPrimaryQty: documents.remainingByLine.get(line.id) ?? 0,
          },
        ];
      }),
      hasReceivableAnnouncedDelivery: deliveries.some(
        (delivery) =>
          delivery.source === InboundDeliverySourceValues.ANNOUNCED &&
          delivery.canReceive &&
          delivery.draftGoodsReceiptId === null,
      ),
      hasDraftReceipt: receipts.some((receipt) => receipt.status === GoodsReceiptStatusValues.DRAFT),
      hasDraftInvoice: invoices.some((invoice) => invoice.status === SupplierInvoiceStatusValues.DRAFT),
      invoiceablePrimaryQty: await this.findInvoiceablePrimaryQty(purchase, leg, liveOrders),
    };
    return {
      facts,
      documents: { purchaseOrders, deliveries, receipts, invoices },
      orderLines,
      remainingByLine: documents.remainingByLine,
    };
  }

  // Sums what the posted receipts of a leg's live POs accepted and live invoices have not invoiced yet
  private async findInvoiceablePrimaryQty(
    purchase: PurchaseRow,
    leg: ProgressLeg,
    liveOrders: PurchaseOrderRow[],
  ): Promise<number> {
    if (liveOrders.length === 0 || !this.legsService.isFulfilling(leg)) return 0;
    const orderIds = new Set(liveOrders.map((po) => po.id));
    const rows = await this.invoicesService.findInvoiceableGoodsReceiptRows({
      supplierId: leg.supplierId,
      siteId: purchase.siteId,
    });
    return rows
      .filter((row) => orderIds.has(row.purchaseOrderId))
      .reduce((total, row) => total.plus(row.acceptedPrimaryQty).minus(row.invoicedPrimaryQty), new Decimal(0))
      .toNumber();
  }
}

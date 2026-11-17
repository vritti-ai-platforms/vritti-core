import type { GoodsReceiptRow } from '@domain/goods-receipts/repositories/goods-receipts.repository';
import { GoodsReceiptsDomainService } from '@domain/goods-receipts/services/goods-receipts.service';
import type { InboundDeliveryRow } from '@domain/inbound-deliveries/repositories/inbound-deliveries.repository';
import { InboundDeliveriesDomainService } from '@domain/inbound-deliveries/services/inbound-deliveries.service';
import { InboundDeliveryLinesDomainService } from '@domain/inbound-deliveries/services/inbound-delivery-lines.service';
import type { PurchaseAllocationRow } from '@domain/purchase-item-allocations/repositories/purchase-item-allocations.repository';
import { PurchaseItemAllocationsDomainService } from '@domain/purchase-item-allocations/services/purchase-item-allocations.service';
import { PurchaseItemsDomainService } from '@domain/purchase-items/services/purchase-items.service';
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
import { PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import type { InvoiceableGoodsReceiptRow } from '@domain/supplier-invoices/repositories/invoiceable-goods-receipts.repository';
import type { SupplierInvoiceRow } from '@domain/supplier-invoices/repositories/supplier-invoices.repository';
import { SupplierInvoicesDomainService } from '@domain/supplier-invoices/services/supplier-invoices.service';
import { Injectable } from '@nestjs/common';
import Decimal from '@vritti/api-sdk/decimal';
import {
  GoodsReceiptStatusValues,
  InboundDeliverySourceValues,
  type InboundDeliveryStatus,
  InboundDeliveryStatusValues,
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

interface PurchaseDocuments {
  allocations: PurchaseAllocationRow[];
  purchaseOrders: PurchaseOrderRow[];
  orderLines: PurchaseOrderItemRow[];
  remainingByLine: Map<string, number>;
  deliveries: InboundDeliveryRow[];
  receipts: GoodsReceiptRow[];
  invoices: SupplierInvoiceRow[];
  invoiceable: InvoiceableGoodsReceiptRow[];
}

type ProgressLeg = Leg & Pick<PurchaseSupplier, 'supplierId' | 'receivingClosedAt'>;

@Injectable()
export class PurchaseProgressService {
  private static readonly ON_THE_WAY: InboundDeliveryStatus[] = [
    InboundDeliveryStatusValues.IN_TRANSIT,
    InboundDeliveryStatusValues.ARRIVED,
  ];

  constructor(
    private readonly purchasesService: PurchasesDomainService,
    private readonly purchasesRepository: PurchasesDomainRepository,
    private readonly legsService: PurchaseSuppliersDomainService,
    private readonly allocationsService: PurchaseItemAllocationsDomainService,
    private readonly itemsService: PurchaseItemsDomainService,
    private readonly purchaseOrdersService: PurchaseOrdersDomainService,
    private readonly purchaseOrderItemsService: PurchaseOrderItemsDomainService,
    private readonly deliveriesService: InboundDeliveriesDomainService,
    private readonly deliveryLinesService: InboundDeliveryLinesDomainService,
    private readonly goodsReceiptsService: GoodsReceiptsDomainService,
    private readonly invoicesService: SupplierInvoicesDomainService,
  ) {}

  // Re-derives a leg's step from its documents, in the caller's transaction; a leg that is now received and invoiced
  // closes and the purchase completes once it is done
  async syncLegStep(purchase: PurchaseRow, leg: ProgressLeg): Promise<LegAdvance> {
    const { facts } = await this.findLegFulfilment(purchase, leg);
    const advance = await this.legsService.advance(leg, facts);
    if (advance.isClosed) await this.completeIfDone(purchase);
    return advance;
  }

  // Completes the purchase once nothing is left to allocate and every leg is closed or cancelled, at least one closed, in
  // the caller's transaction
  async completeIfDone(purchase: PurchaseRow): Promise<void> {
    const legs = await this.legsService.findByPurchaseId(purchase.id);
    await this.purchasesService.completeIfDone(purchase, {
      allLegsDone: this.legsService.allDone(legs),
      hasUnallocated: await this.itemsService.hasUnallocated(purchase.id),
    });
  }

  // Tells a purchase that one of its documents was completed in its own feature, in the caller's transaction:
  // re-derives the step of the supplier's leg
  async notifyDocument(purchaseId: string, supplierId: string): Promise<void> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(purchaseId);
    const leg = await this.legsService.findForSupplier(purchase.id, supplierId);
    if (!leg) return;
    await this.syncLegStep(purchase, leg);
  }

  // Tells every purchase an invoice invoices that it was posted or cancelled, in the caller's transaction
  async notifyInvoice(invoice: Pick<SupplierInvoiceRow, 'supplierId' | 'purchases'>): Promise<void> {
    for (const purchase of invoice.purchases) await this.notifyDocument(purchase.id, invoice.supplierId);
  }

  // Gathers each leg's documents and the facts its step and actions derive from, in the order of the given legs
  async findFulfilment(purchase: PurchaseRow, legs: ProgressLeg[]): Promise<PurchaseLegFulfilment[]> {
    const documents = await this.findDocuments(purchase);
    return legs.map((leg) => this.legFulfilment(leg, documents));
  }

  // Gathers only the documents of each leg, in the order of the given legs
  async findLegDocuments(purchaseId: string, legs: Pick<ProgressLeg, 'supplierId'>[]): Promise<PurchaseLegDocuments[]> {
    const [purchaseOrders, deliveries, receipts, invoices] = await Promise.all([
      this.purchaseOrdersService.findForPurchase(purchaseId),
      this.deliveriesService.findForPurchase(purchaseId),
      this.goodsReceiptsService.findForPurchase(purchaseId),
      this.invoicesService.findForPurchase(purchaseId),
    ]);
    return legs.map((leg) => {
      const ofSupplier = <T extends { supplierId: string }>(rows: T[]) =>
        rows.filter((row) => row.supplierId === leg.supplierId);
      return {
        purchaseOrders: ofSupplier(purchaseOrders),
        deliveries: ofSupplier(deliveries),
        receipts: ofSupplier(receipts),
        invoices: ofSupplier(invoices),
      };
    });
  }

  // Gathers one leg's documents and fulfilment facts
  async findLegFulfilment(purchase: PurchaseRow, leg: ProgressLeg): Promise<PurchaseLegFulfilment> {
    const [fulfilment] = await this.findFulfilment(purchase, [leg]);
    return fulfilment;
  }

  // Loads every document a purchase created or its lines invoice, with the lines of its live POs, what they still have
  // free to deliver and the posted receipts of them still to invoice
  private async findDocuments(purchase: PurchaseRow): Promise<PurchaseDocuments> {
    const purchaseId = purchase.id;
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
    const [orderLines, invoiceable] = await Promise.all([
      this.purchaseOrderItemsService.findRowsByPurchaseOrderIds(liveOrderIds),
      liveOrderIds.length > 0
        ? this.invoicesService.findInvoiceableGoodsReceiptRows({
            siteId: purchase.siteId,
            purchaseOrderIds: liveOrderIds,
          })
        : [],
    ]);
    const remainingByLine = await this.deliveryLinesService.findRemainingToDeliver(orderLines.map((line) => line.id));
    return { allocations, purchaseOrders, orderLines, remainingByLine, deliveries, receipts, invoices, invoiceable };
  }

  // Narrows a purchase's documents to one leg (its supplier) and works out the facts its step and actions derive from
  private legFulfilment(leg: ProgressLeg, documents: PurchaseDocuments): PurchaseLegFulfilment {
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
      hasDeliveryOnTheWay: deliveries.some((delivery) => PurchaseProgressService.ON_THE_WAY.includes(delivery.status)),
      hasPostedDocument:
        receipts.some((receipt) => receipt.status === GoodsReceiptStatusValues.POSTED) ||
        invoices.some((invoice) => invoice.status === SupplierInvoiceStatusValues.POSTED),
      receivingClosed: leg.receivingClosedAt !== null,
      invoiceablePrimaryQty: this.legsService.isFulfilling(leg)
        ? documents.invoiceable
            .filter((row) => statusByOrder.has(row.purchaseOrderId))
            .reduce((total, row) => total.plus(row.acceptedPrimaryQty).minus(row.invoicedPrimaryQty), new Decimal(0))
            .toNumber()
        : 0,
    };
    return {
      facts,
      documents: { purchaseOrders, deliveries, receipts, invoices },
      orderLines,
      remainingByLine: documents.remainingByLine,
    };
  }
}

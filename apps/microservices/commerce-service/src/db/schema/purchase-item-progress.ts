import { and, eq, gte, isNull, lte, notInArray, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { QueryBuilder, unionAll } from '@vritti/api-sdk/drizzle-pg-core';
import {
  GoodsReceiptStatusValues,
  InboundDeliveryStatusValues,
  PurchaseOrderStatusValues,
  SupplierInvoiceLineTypeValues,
} from './enums';
import { goodsReceiptItems } from './goods-receipt-items';
import { goodsReceipts } from './goods-receipts';
import { inboundDeliveries, inboundDeliveryLines } from './inbound-deliveries';
import { parties } from './parties';
import { purchaseItemAllocations } from './purchase-item-allocations';
import { purchaseItems } from './purchase-items';
import { purchaseOrderItems, purchaseOrders } from './purchase-orders';
import { purchaseSuppliers } from './purchase-suppliers';
import { supplierInvoiceLines, supplierInvoices } from './supplier-invoices';
import { supplierQuotationItems, supplierQuotationSites, supplierQuotations } from './supplier-quotations';
import { suppliers } from './suppliers';

// How far each purchase item has got, in primary units, as correlated subqueries on the outer purchase item: what is
// allocated, ordered on live POs, on its way, received net of returns and invoiced

const liveOrder = notInArray(purchaseOrders.status, [
  PurchaseOrderStatusValues.CANCELLED,
  PurchaseOrderStatusValues.REJECTED,
]);

// Sums an amount over the PO lines the outer item's allocations became
const overOrderLines = (amount: SQL, where?: SQL) =>
  sql<number>`(${new QueryBuilder()
    .select({ total: sql`coalesce(sum(${amount}), 0)` })
    .from(purchaseItemAllocations)
    .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, purchaseItemAllocations.purchaseOrderItemId))
    .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
    .where(and(eq(purchaseItemAllocations.purchaseItemId, purchaseItems.id), where))})`.mapWith(Number);

// What the outer PO line's open deliveries carry that posted receipts have not yet accepted
const inTransitOnOrderLine = () => {
  const accepted = new QueryBuilder()
    .select({
      total: sql`coalesce(sum(${goodsReceiptItems.receivedPrimaryQty} - ${goodsReceiptItems.rejectedPrimaryQty}), 0)`,
    })
    .from(goodsReceiptItems)
    .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
    .where(
      and(
        eq(goodsReceiptItems.inboundDeliveryLineId, inboundDeliveryLines.id),
        eq(goodsReceipts.status, GoodsReceiptStatusValues.POSTED),
      ),
    );
  return sql`(${new QueryBuilder()
    .select({ total: sql`coalesce(sum(greatest(${inboundDeliveryLines.primaryUomQty} - (${accepted}), 0)), 0)` })
    .from(inboundDeliveryLines)
    .innerJoin(inboundDeliveries, eq(inboundDeliveries.id, inboundDeliveryLines.inboundDeliveryId))
    .where(
      and(
        eq(inboundDeliveryLines.purchaseOrderItemId, purchaseOrderItems.id),
        notInArray(inboundDeliveries.status, [
          InboundDeliveryStatusValues.RECEIVED,
          InboundDeliveryStatusValues.CANCELLED,
        ]),
      ),
    )})`;
};

export interface PurchaseItemSupplierProgress {
  legId: string;
  supplierId: string;
  supplierName: string;
  allocated: number;
  ordered: number;
  inTransit: number;
  received: number;
  invoiced: number;
}

// The outer item's allocations grouped by supplier, each with the quantities its PO lines reached
const bySupplier = () => {
  const total = (amount: SQL) => sql<number>`coalesce(sum(${amount}), 0)`;
  const lines = new QueryBuilder()
    .select({
      legId: sql<string>`${purchaseSuppliers.id}`.as('leg_id'),
      supplierId: sql<string>`${purchaseSuppliers.supplierId}`.as('supplier_id'),
      supplierName: sql<string>`${parties.displayName}`.as('supplier_name'),
      allocated: total(sql`${purchaseItemAllocations.primaryUomQty}`).as('allocated'),
      ordered: total(
        sql`case when ${liveOrder} then ${purchaseOrderItems.primaryUomQty} + ${purchaseOrderItems.freePrimaryQty} - ${purchaseOrderItems.cancelledPrimaryQty} end`,
      ).as('ordered'),
      inTransit: total(inTransitOnOrderLine()).as('in_transit'),
      received: total(sql`${purchaseOrderItems.receivedPrimaryQty} - ${purchaseOrderItems.returnedPrimaryQty}`).as(
        'received',
      ),
      invoiced: total(sql`${purchaseOrderItems.invoicedPrimaryQty}`).as('invoiced'),
    })
    .from(purchaseItemAllocations)
    .innerJoin(purchaseSuppliers, eq(purchaseSuppliers.id, purchaseItemAllocations.purchaseSupplierId))
    .innerJoin(suppliers, eq(suppliers.id, purchaseSuppliers.supplierId))
    .innerJoin(parties, eq(parties.id, suppliers.partyId))
    .leftJoin(purchaseOrderItems, eq(purchaseOrderItems.id, purchaseItemAllocations.purchaseOrderItemId))
    .leftJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
    .where(eq(purchaseItemAllocations.purchaseItemId, purchaseItems.id))
    .groupBy(purchaseSuppliers.id, purchaseSuppliers.supplierId, parties.displayName)
    .as('item_suppliers');
  return sql<PurchaseItemSupplierProgress[]>`coalesce((${new QueryBuilder()
    .select({
      list: sql`json_agg(json_build_object('legId', ${lines.legId}, 'supplierId', ${lines.supplierId}, 'supplierName', ${lines.supplierName}, 'allocated', ${lines.allocated}, 'ordered', ${lines.ordered}, 'inTransit', ${lines.inTransit}, 'received', ${lines.received}, 'invoiced', ${lines.invoiced}) order by ${lines.supplierName})`,
    })
    .from(lines)}), '[]'::json)`;
};

export const purchaseItemProgress = {
  allocated: () =>
    sql<number>`(${new QueryBuilder()
      .select({ total: sql`coalesce(sum(${purchaseItemAllocations.primaryUomQty}), 0)` })
      .from(purchaseItemAllocations)
      .where(eq(purchaseItemAllocations.purchaseItemId, purchaseItems.id))})`.mapWith(Number),
  ordered: () =>
    overOrderLines(
      sql`${purchaseOrderItems.primaryUomQty} + ${purchaseOrderItems.freePrimaryQty} - ${purchaseOrderItems.cancelledPrimaryQty}`,
      liveOrder,
    ),
  inTransit: () => overOrderLines(inTransitOnOrderLine()),
  received: () =>
    overOrderLines(sql`${purchaseOrderItems.receivedPrimaryQty} - ${purchaseOrderItems.returnedPrimaryQty}`),
  invoiced: () => overOrderLines(sql`${purchaseOrderItems.invoicedPrimaryQty}`),
  // The suppliers whose quotation for the item's purchase quotes it, is posted to the site or its legal entity and is
  // valid on the day
  quotingSuppliers: (siteId: string, onDate: string) =>
    sql<number>`(${new QueryBuilder()
      .select({ total: sql`count(distinct ${supplierQuotations.supplierId})::int` })
      .from(supplierQuotationItems)
      .innerJoin(supplierQuotations, eq(supplierQuotations.id, supplierQuotationItems.quotationId))
      .where(
        and(
          eq(supplierQuotationItems.purchaseItemId, purchaseItems.id),
          eq(supplierQuotations.purchaseId, purchaseItems.purchaseId),
          lte(supplierQuotations.validFrom, onDate),
          or(isNull(supplierQuotations.validTo), gte(supplierQuotations.validTo, onDate)),
          sql`exists (${new QueryBuilder()
            .select({ one: sql`1` })
            .from(supplierQuotationSites)
            .where(
              and(
                eq(supplierQuotationSites.quotationId, supplierQuotations.id),
                or(eq(supplierQuotationSites.siteId, siteId), isNull(supplierQuotationSites.siteId)),
              ),
            )})`,
        ),
      )})`.mapWith(Number),
  // Each supplier the item is allocated to, by name, with how far its share has got
  bySupplier,
  // Whether the item is allocated to the given supplier
  isAllocatedTo: (supplierId: string) =>
    sql<boolean>`exists (${new QueryBuilder()
      .select({ one: sql`1` })
      .from(purchaseItemAllocations)
      .innerJoin(purchaseSuppliers, eq(purchaseSuppliers.id, purchaseItemAllocations.purchaseSupplierId))
      .where(
        and(eq(purchaseItemAllocations.purchaseItemId, purchaseItems.id), eq(purchaseSuppliers.supplierId, supplierId)),
      )})`,
};

export const PurchaseItemBucketValues = {
  NOT_ALLOCATED: 'NOT_ALLOCATED',
  NEEDS_QUOTATIONS: 'NEEDS_QUOTATIONS',
  ALLOCATED: 'ALLOCATED',
  ORDERED: 'ORDERED',
  IN_TRANSIT: 'IN_TRANSIT',
  RECEIVED: 'RECEIVED',
  INVOICED: 'INVOICED',
} as const;

export type PurchaseItemBucket = (typeof PurchaseItemBucketValues)[keyof typeof PurchaseItemBucketValues];

// The condition an outer purchase item meets in a bucket: quantity still to allocate (and, where the purchase requires
// quotations, short of them), allocated but not ordered, ordered but not on its way, on its way, received but not
// invoiced, or fully invoiced
export const purchaseItemBucketCondition = (
  bucket: PurchaseItemBucket,
  quoting: { required: boolean; minimum: number; siteId: string; onDate: string },
): SQL => {
  const progress = purchaseItemProgress;
  const notAllocated = sql`${purchaseItems.primaryQty} > ${progress.allocated()}`;
  switch (bucket) {
    case PurchaseItemBucketValues.NOT_ALLOCATED:
      return notAllocated;
    case PurchaseItemBucketValues.NEEDS_QUOTATIONS:
      return quoting.required
        ? sql`${notAllocated} and ${progress.quotingSuppliers(quoting.siteId, quoting.onDate)} < ${quoting.minimum}`
        : sql`false`;
    case PurchaseItemBucketValues.ALLOCATED:
      return sql`${progress.allocated()} > ${progress.ordered()}`;
    case PurchaseItemBucketValues.ORDERED:
      return sql`${progress.ordered()} > ${progress.received()} + ${progress.inTransit()}`;
    case PurchaseItemBucketValues.IN_TRANSIT:
      return sql`${progress.inTransit()} > 0`;
    case PurchaseItemBucketValues.RECEIVED:
      return sql`${progress.received()} > ${progress.invoiced()}`;
    case PurchaseItemBucketValues.INVOICED:
      return sql`${progress.invoiced()} >= ${purchaseItems.primaryQty}`;
  }
};

// The kinds of document that move a purchase item once it is ordered
export const PurchaseItemDocumentTypeValues = {
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  INBOUND_DELIVERY: 'INBOUND_DELIVERY',
  GOODS_RECEIPT: 'GOODS_RECEIPT',
  SUPPLIER_INVOICE: 'SUPPLIER_INVOICE',
} as const;
export type PurchaseItemDocumentType =
  (typeof PurchaseItemDocumentTypeValues)[keyof typeof PurchaseItemDocumentTypeValues];

// One branch of the item's documents: a document line on a PO line an allocation of the item became, with its document,
// its supplier and its quantity in the item's primary unit
const documentLines = (
  type: PurchaseItemDocumentType,
  line: { id: SQL; documentId: SQL; documentNumber: SQL; status: SQL; date: SQL; supplierId: SQL; primaryQty: SQL },
) => ({
  lineId: sql<string>`${line.id}`.as('line_id'),
  purchaseItemId: sql<string>`${purchaseItemAllocations.purchaseItemId}`.as('purchase_item_id'),
  type: sql<PurchaseItemDocumentType>`${type}::text`.as('type'),
  documentId: sql<string>`${line.documentId}`.as('document_id'),
  documentNumber: sql<string>`${line.documentNumber}`.as('document_number'),
  status: sql<string>`${line.status}::text`.as('status'),
  date: sql<string>`${line.date}::date::text`.as('date'),
  supplierId: sql<string>`${line.supplierId}`.as('supplier_id'),
  primaryQty: sql<number>`${line.primaryQty}`.as('primary_qty'),
});

// Every document line that moves a purchase item: its PO lines, the inbound delivery lines, goods receipt items and
// supplier invoice lines on them; filter on purchaseItemId
export const purchaseItemDocuments = unionAll(
  new QueryBuilder()
    .select(
      documentLines(PurchaseItemDocumentTypeValues.PURCHASE_ORDER, {
        id: sql`${purchaseOrderItems.id}`,
        documentId: sql`${purchaseOrders.id}`,
        documentNumber: sql`${purchaseOrders.poNumber}`,
        status: sql`${purchaseOrders.status}`,
        date: sql`${purchaseOrders.orderDate}`,
        supplierId: sql`${purchaseOrders.supplierId}`,
        primaryQty: sql`${purchaseOrderItems.primaryUomQty}`,
      }),
    )
    .from(purchaseItemAllocations)
    .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, purchaseItemAllocations.purchaseOrderItemId))
    .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId)),
  new QueryBuilder()
    .select(
      documentLines(PurchaseItemDocumentTypeValues.INBOUND_DELIVERY, {
        id: sql`${inboundDeliveryLines.id}`,
        documentId: sql`${inboundDeliveries.id}`,
        documentNumber: sql`${inboundDeliveries.deliveryNumber}`,
        status: sql`${inboundDeliveries.status}`,
        date: sql`${inboundDeliveries.expectedDeliveryDate}`,
        supplierId: sql`${inboundDeliveries.supplierId}`,
        primaryQty: sql`${inboundDeliveryLines.primaryUomQty}`,
      }),
    )
    .from(purchaseItemAllocations)
    .innerJoin(
      inboundDeliveryLines,
      eq(inboundDeliveryLines.purchaseOrderItemId, purchaseItemAllocations.purchaseOrderItemId),
    )
    .innerJoin(inboundDeliveries, eq(inboundDeliveries.id, inboundDeliveryLines.inboundDeliveryId)),
  new QueryBuilder()
    .select(
      documentLines(PurchaseItemDocumentTypeValues.GOODS_RECEIPT, {
        id: sql`${goodsReceiptItems.id}`,
        documentId: sql`${goodsReceipts.id}`,
        documentNumber: sql`${goodsReceipts.grNumber}`,
        status: sql`${goodsReceipts.status}`,
        date: sql`${goodsReceipts.receivedDate}`,
        supplierId: sql`${goodsReceipts.supplierId}`,
        primaryQty: sql`${goodsReceiptItems.receivedPrimaryQty}`,
      }),
    )
    .from(purchaseItemAllocations)
    .innerJoin(
      goodsReceiptItems,
      eq(goodsReceiptItems.purchaseOrderItemId, purchaseItemAllocations.purchaseOrderItemId),
    )
    .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId)),
  new QueryBuilder()
    .select(
      documentLines(PurchaseItemDocumentTypeValues.SUPPLIER_INVOICE, {
        id: sql`${supplierInvoiceLines.id}`,
        documentId: sql`${supplierInvoices.id}`,
        documentNumber: sql`${supplierInvoices.invoiceNumber}`,
        status: sql`${supplierInvoices.status}`,
        date: sql`${supplierInvoices.invoiceDate}`,
        supplierId: sql`${supplierInvoices.supplierId}`,
        primaryQty: sql`coalesce(${supplierInvoiceLines.invoicedPrimaryQty}, 0)`,
      }),
    )
    .from(purchaseItemAllocations)
    .innerJoin(
      supplierInvoiceLines,
      and(
        eq(supplierInvoiceLines.purchaseOrderItemId, purchaseItemAllocations.purchaseOrderItemId),
        eq(supplierInvoiceLines.lineType, SupplierInvoiceLineTypeValues.ITEM),
      ),
    )
    .innerJoin(supplierInvoices, eq(supplierInvoices.id, supplierInvoiceLines.supplierInvoiceId)),
).as('purchase_item_documents');

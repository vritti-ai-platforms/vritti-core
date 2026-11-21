import { Injectable } from '@nestjs/common';
import type { SearchState } from '@vritti/api-sdk/conditions';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, exists, getColumns, gt, ilike, ne, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  GoodsReceiptStatusValues,
  goodsReceiptItems,
  goodsReceipts,
  InboundDeliverySourceValues,
  inboundDeliveries,
  parties,
  paymentTerms,
  purchaseOrderItems,
  purchaseOrders,
  purchases,
  type SupplierInvoice,
  SupplierInvoiceStatusValues,
  supplierInvoiceHolds,
  supplierInvoiceLines,
  supplierInvoices,
  suppliers,
} from '@/db/schema';

export type SupplierInvoicePurchaseRef = {
  id: string;
  purchaseNumber: string;
};

export type SupplierInvoiceRow = SupplierInvoice & {
  supplierName: string | null;
  isSupplierPaymentBlocked: boolean;
  paymentTermName: string | null;
  poNumbers: string[];
  purchases: SupplierInvoicePurchaseRef[];
  isReceiveWithInvoice: boolean;
  lineCount: number;
};

export type SupplierInvoiceCounts = {
  lineCount: number;
  holdCount: number;
};

export type SupplierInvoiceScope = {
  supplierId?: string;
  purchaseOrderId?: string;
};

export type PurchaseOrderInvoiceSummaryRow = {
  invoiceCount: number;
  heldInvoiceCount: number;
  invoicedPrimaryQty: string;
  duePrimaryQty: string;
};

@Injectable()
export class SupplierInvoicesDomainRepository extends PrimaryBaseRepository<typeof supplierInvoices> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierInvoices);
  }

  // Returns one page of invoices in the scope with their supplier names, order numbers and line counts
  findForTable(
    scope: SupplierInvoiceScope,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
  ): Promise<{ result: SupplierInvoiceRow[]; count: number }> {
    return this.findAllAndCount<SupplierInvoiceRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: and(this.scopeWhere(scope), options.where),
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Loads an invoice in the scope with its names and line count
  findDetail(id: string, scope: SupplierInvoiceScope = {}): Promise<SupplierInvoiceRow | undefined> {
    return this.findById<SupplierInvoiceRow>(id, {
      select: this.selection(),
      leftJoins: this.joins(),
      where: this.scopeWhere(scope),
    });
  }

  // Counts an invoice's lines and holds, throwing when it is out of the scope or of reach
  async findCountsOrThrow(id: string, scope: SupplierInvoiceScope = {}): Promise<SupplierInvoiceCounts> {
    const counts = await this.findById<SupplierInvoiceCounts>(id, {
      select: this.counts(),
      where: this.scopeWhere(scope),
    });
    if (!counts) throw new NotFoundException('Supplier invoice not found.');
    return counts;
  }

  // Returns the invoices with a line on a PO a purchase created, oldest first
  findForPurchase(purchaseId: string): Promise<SupplierInvoiceRow[]> {
    return this.findAllWithSelect<SupplierInvoiceRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: exists(this.linesOnOrdersWhere(eq(purchaseOrders.purchaseId, purchaseId))),
      orderBy: [asc(supplierInvoices.createdAt)],
    });
  }

  // Returns the numbers of the receipts the invoice's lines invoice that are not posted yet
  async findUnpostedReceiptNumbers(id: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ grNumber: goodsReceipts.grNumber })
      .from(supplierInvoiceLines)
      .innerJoin(goodsReceiptItems, eq(goodsReceiptItems.id, supplierInvoiceLines.goodsReceiptItemId))
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .where(
        and(eq(supplierInvoiceLines.supplierInvoiceId, id), ne(goodsReceipts.status, GoodsReceiptStatusValues.POSTED)),
      );
    return rows.map((row) => row.grNumber);
  }

  // Matches invoices with a line on a purchase order whose number contains the search, when it searches PO numbers
  matchesPurchaseOrderNumber(search: SearchState | null | undefined): SQL | undefined {
    if (!search?.value || (search.columnId !== 'all' && search.columnId !== 'poNumbers')) return undefined;
    return exists(this.linesOnOrdersWhere(ilike(purchaseOrders.poNumber, `%${search.value}%`)));
  }

  // Whether the supplier already has another invoice with the number
  isInvoiceNumberTaken(supplierId: string, invoiceNumber: string, excludeId?: string): Promise<boolean> {
    return this.exists(
      and(
        eq(supplierInvoices.supplierId, supplierId),
        eq(supplierInvoices.invoiceNumber, invoiceNumber),
        excludeId ? ne(supplierInvoices.id, excludeId) : undefined,
      ) as SQL,
    );
  }

  // Recomputes the header totals from the lines: subtotal before discount and tax, then the discount, tax and total
  async syncTotals(id: string): Promise<void> {
    const lineSum = (amount: SQL) =>
      sql`(${this.db
        .select({ total: sql`coalesce(sum(${amount}), 0)` })
        .from(supplierInvoiceLines)
        .where(eq(supplierInvoiceLines.supplierInvoiceId, id))})`;
    await this.db
      .update(supplierInvoices)
      .set({
        subtotal: lineSum(
          sql`${supplierInvoiceLines.lineTotal} + ${supplierInvoiceLines.discountAmount} - ${supplierInvoiceLines.taxAmount}`,
        ),
        discountAmount: lineSum(sql`${supplierInvoiceLines.discountAmount}`),
        taxAmount: lineSum(sql`${supplierInvoiceLines.taxAmount}`),
        totalAmount: lineSum(sql`${supplierInvoiceLines.lineTotal}`),
      })
      .where(eq(supplierInvoices.id, id));
  }

  // Counts the live invoices with a line on a purchase order and the held ones, and totals its invoiced and due primary quantities
  async findPurchaseOrderSummary(purchaseOrderId: string): Promise<PurchaseOrderInvoiceSummaryRow> {
    const liveInvoice = and(
      ne(supplierInvoices.status, SupplierInvoiceStatusValues.CANCELLED),
      exists(this.linesOnOrdersWhere(eq(purchaseOrders.id, purchaseOrderId))),
    );
    const orderLines = eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId);
    const [row] = await this.db
      .select({
        invoiceCount: this.db.$count(supplierInvoices, liveInvoice),
        heldInvoiceCount: this.db.$count(supplierInvoices, and(liveInvoice, gt(supplierInvoices.openHoldCount, 0))),
        invoicedPrimaryQty: sql<string>`(${this.db
          .select({ total: sql`coalesce(sum(${purchaseOrderItems.invoicedPrimaryQty}), 0)` })
          .from(purchaseOrderItems)
          .where(orderLines)})`,
        duePrimaryQty: sql<string>`(${this.db
          .select({
            total: sql`coalesce(sum(${purchaseOrderItems.primaryUomQty} + ${purchaseOrderItems.freePrimaryQty} - ${purchaseOrderItems.cancelledPrimaryQty}), 0)`,
          })
          .from(purchaseOrderItems)
          .where(orderLines)})`,
      })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, purchaseOrderId));
    return row ?? { invoiceCount: 0, heldInvoiceCount: 0, invoicedPrimaryQty: '0', duePrimaryQty: '0' };
  }

  // Sets the cached count of open holds that block payment
  async setOpenHoldCount(id: string, openHoldCount: number): Promise<void> {
    await this.update(id, { openHoldCount });
  }

  // Selects an invoice with its supplier's name and payment block, payment term, the numbers of the orders and the
  // purchases its lines invoice, whether it is a Receive with Invoice (a line on a receipt of a delivery its invoice created) and its
  // line count
  private selection() {
    const purchaseRefs = this.db
      .select({
        refs: sql`jsonb_agg(distinct jsonb_build_object('id', ${purchases.id}, 'purchaseNumber', ${purchases.purchaseNumber}))`,
      })
      .from(supplierInvoiceLines)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, supplierInvoiceLines.purchaseOrderItemId))
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .innerJoin(purchases, eq(purchases.id, purchaseOrders.purchaseId))
      .where(eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoices.id));
    const receiveWithInvoiceLine = this.db
      .select({ id: supplierInvoiceLines.id })
      .from(supplierInvoiceLines)
      .innerJoin(goodsReceiptItems, eq(goodsReceiptItems.id, supplierInvoiceLines.goodsReceiptItemId))
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .innerJoin(inboundDeliveries, eq(inboundDeliveries.id, goodsReceipts.inboundDeliveryId))
      .where(
        and(
          eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoices.id),
          eq(inboundDeliveries.source, InboundDeliverySourceValues.SUPPLIER_INVOICE),
        ),
      );
    const poNumbers = this.db
      .select({ poNumbers: sql`array_agg(distinct ${purchaseOrders.poNumber} order by ${purchaseOrders.poNumber})` })
      .from(supplierInvoiceLines)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, supplierInvoiceLines.purchaseOrderItemId))
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .where(eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoices.id));
    return {
      ...getColumns(supplierInvoices),
      supplierName: parties.displayName,
      isSupplierPaymentBlocked: suppliers.paymentBlocked,
      paymentTermName: paymentTerms.name,
      poNumbers: sql<string[]>`coalesce((${poNumbers}), '{}')`,
      purchases: sql<SupplierInvoicePurchaseRef[]>`coalesce((${purchaseRefs}), '[]'::jsonb)`,
      isReceiveWithInvoice: sql<boolean>`${exists(receiveWithInvoiceLine)}`,
      lineCount: this.db.$count(supplierInvoiceLines, eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoices.id)),
    };
  }

  // Counts the rows each of an invoice's tabs lists: its lines and every hold on it, released ones included
  private counts() {
    return {
      lineCount: this.db.$count(supplierInvoiceLines, eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoices.id)),
      holdCount: this.db.$count(supplierInvoiceHolds, eq(supplierInvoiceHolds.supplierInvoiceId, supplierInvoices.id)),
    };
  }

  // Joins the supplier with its party for its name, and the payment term
  private joins() {
    return [
      { table: suppliers, on: eq(suppliers.id, supplierInvoices.supplierId) },
      { table: parties, on: eq(parties.id, suppliers.partyId) },
      { table: paymentTerms, on: eq(paymentTerms.id, supplierInvoices.paymentTermId) },
    ];
  }

  // Narrows invoices to the supplier, or to those with a line on the purchase order, a view lists
  private scopeWhere(scope: SupplierInvoiceScope): SQL | undefined {
    return and(
      scope.supplierId ? eq(supplierInvoices.supplierId, scope.supplierId) : undefined,
      scope.purchaseOrderId ? exists(this.linesOnOrdersWhere(eq(purchaseOrders.id, scope.purchaseOrderId))) : undefined,
    );
  }

  // Selects the outer invoice's lines whose purchase order matches the condition
  private linesOnOrdersWhere(condition: SQL) {
    return this.db
      .select({ id: supplierInvoiceLines.id })
      .from(supplierInvoiceLines)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, supplierInvoiceLines.purchaseOrderItemId))
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .where(and(eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoices.id), condition));
  }
}

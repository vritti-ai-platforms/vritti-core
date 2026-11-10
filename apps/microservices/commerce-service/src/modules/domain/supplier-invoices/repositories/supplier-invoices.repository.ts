import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, getColumns, gt, inArray, ne, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  type PurchaseOrder,
  type PurchaseOrderStatus,
  PurchaseOrderStatusValues,
  parties,
  purchaseOrderItems,
  purchaseOrders,
  type SupplierInvoice,
  SupplierInvoiceStatusValues,
  supplierInvoiceLines,
  supplierInvoices,
  suppliers,
} from '@/db/schema';

export type SupplierInvoiceRow = SupplierInvoice & {
  supplierName: string | null;
  poNumber: string;
  poExchangeRate: number;
  lineCount: number;
};

export type SupplierInvoiceScope = {
  supplierId?: string;
  purchaseOrderId?: string;
};

export type InvoiceablePurchaseOrder = Pick<
  PurchaseOrder,
  'id' | 'supplierId' | 'siteId' | 'legalEntityId' | 'currencyCode' | 'exchangeRate' | 'poNumber'
>;

export type PurchaseOrderInvoiceSummaryRow = {
  invoiceCount: number;
  flaggedInvoiceCount: number;
  billedQty: string;
  orderedQty: string;
};

const INVOICEABLE_PURCHASE_ORDER_STATUSES: PurchaseOrderStatus[] = [
  PurchaseOrderStatusValues.CONFIRMED,
  PurchaseOrderStatusValues.PARTIALLY_RECEIVED,
  PurchaseOrderStatusValues.RECEIVED,
  PurchaseOrderStatusValues.CLOSED,
];

@Injectable()
export class SupplierInvoicesDomainRepository extends PrimaryBaseRepository<typeof supplierInvoices> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierInvoices);
  }

  // Selects an invoice with its supplier's name, the billed order's number and rate, and its line count
  private selection() {
    return {
      ...getColumns(supplierInvoices),
      supplierName: parties.displayName,
      poNumber: purchaseOrders.poNumber,
      poExchangeRate: purchaseOrders.exchangeRate,
      lineCount: this.db.$count(supplierInvoiceLines, eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoices.id)),
    };
  }

  // Joins the supplier's party for its name and the billed purchase order
  private joins() {
    return [
      { table: suppliers, on: eq(suppliers.id, supplierInvoices.supplierId) },
      { table: parties, on: eq(parties.id, suppliers.partyId) },
      { table: purchaseOrders, on: eq(purchaseOrders.id, supplierInvoices.purchaseOrderId) },
    ];
  }

  // Narrows invoices to the supplier or purchase order a view lists
  private scopeWhere(scope: SupplierInvoiceScope): SQL | undefined {
    return and(
      scope.supplierId ? eq(supplierInvoices.supplierId, scope.supplierId) : undefined,
      scope.purchaseOrderId ? eq(supplierInvoices.purchaseOrderId, scope.purchaseOrderId) : undefined,
    );
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

  // Loads an invoice in the scope with its names and line count, throwing when it is out of reach
  async findDetailOrThrow(id: string, scope: SupplierInvoiceScope = {}): Promise<SupplierInvoiceRow> {
    const row = await this.findById<SupplierInvoiceRow>(id, {
      select: this.selection(),
      leftJoins: this.joins(),
      where: this.scopeWhere(scope),
    });
    if (!row) throw new NotFoundException('Supplier invoice not found.');
    return row;
  }

  // A cancelled invoice is history: its lines, links and costs no longer change
  async findEditableOrThrow(id: string): Promise<SupplierInvoiceRow> {
    const invoice = await this.findDetailOrThrow(id);
    if (invoice.status === SupplierInvoiceStatusValues.CANCELLED) {
      throw new BadRequestException({
        label: 'Invoice cancelled',
        detail: `Invoice "${invoice.invoiceNumber}" is cancelled and can no longer be changed.`,
      });
    }
    return invoice;
  }

  // Rejects a tax date change on an invoice that is no longer a draft
  assertTaxDateEditable(invoice: Pick<SupplierInvoice, 'invoiceNumber' | 'status'>): void {
    if (invoice.status === SupplierInvoiceStatusValues.DRAFT) return;
    throw new BadRequestException({
      label: 'Tax Date Locked',
      detail: `Invoice "${invoice.invoiceNumber}" is ${invoice.status.toLowerCase()}; its tax date can change only while it is a draft.`,
      errors: [{ field: 'taxDate', message: 'Locked once posted' }],
    });
  }

  // Only a draft is posted or deleted; a posted invoice is edited in place or cancelled
  async findDraftOrThrow(id: string, action: 'post' | 'delete'): Promise<SupplierInvoiceRow> {
    const invoice = await this.findDetailOrThrow(id);
    if (invoice.status === SupplierInvoiceStatusValues.DRAFT) return invoice;
    throw new BadRequestException({
      label: 'Invoice is not a draft',
      detail:
        action === 'post'
          ? `Invoice "${invoice.invoiceNumber}" is already ${invoice.status.toLowerCase()}.`
          : `Invoice "${invoice.invoiceNumber}" is ${invoice.status.toLowerCase()}; cancel it instead of deleting it.`,
    });
  }

  // Loads the order an invoice bills, which must be confirmed with the supplier before it can be billed
  async findInvoiceablePurchaseOrderOrThrow(purchaseOrderId: string): Promise<InvoiceablePurchaseOrder> {
    const [purchaseOrder] = await this.db
      .select({
        id: purchaseOrders.id,
        supplierId: purchaseOrders.supplierId,
        siteId: purchaseOrders.siteId,
        legalEntityId: purchaseOrders.legalEntityId,
        currencyCode: purchaseOrders.currencyCode,
        exchangeRate: purchaseOrders.exchangeRate,
        poNumber: purchaseOrders.poNumber,
        status: purchaseOrders.status,
      })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, purchaseOrderId))
      .limit(1);
    if (!purchaseOrder) throw new NotFoundException('Purchase order not found.');
    if (!INVOICEABLE_PURCHASE_ORDER_STATUSES.includes(purchaseOrder.status)) {
      throw new BadRequestException({
        label: 'Order not confirmed',
        detail: `Purchase order "${purchaseOrder.poNumber}" is ${purchaseOrder.status.toLowerCase()}. Only a confirmed order can be billed.`,
        errors: [{ field: 'purchaseOrderId', message: 'Order not confirmed' }],
      });
    }
    return purchaseOrder;
  }

  // A supplier numbers its invoices uniquely, so a repeated number is the same invoice entered twice
  async assertInvoiceNumberFree(supplierId: string, invoiceNumber: string, excludeId?: string): Promise<void> {
    const taken = await this.exists(
      and(
        eq(supplierInvoices.supplierId, supplierId),
        eq(supplierInvoices.invoiceNumber, invoiceNumber),
        excludeId ? ne(supplierInvoices.id, excludeId) : undefined,
      ) as SQL,
    );
    if (!taken) return;
    throw new ConflictException({
      label: 'Invoice already entered',
      detail: `This supplier already has an invoice numbered "${invoiceNumber}".`,
      errors: [{ field: 'invoiceNumber', message: 'Already entered for this supplier' }],
    });
  }

  // An invoice in the legal entity's own currency converts at 1; only a foreign-currency invoice takes another rate
  assertExchangeRateFits(currencyCode: string, leCurrencyCode: string, exchangeRate: number): void {
    if (currencyCode !== leCurrencyCode || exchangeRate === 1) return;
    throw new BadRequestException({
      label: 'Exchange rate is 1',
      detail: `The invoice is in ${leCurrencyCode}, the legal entity's currency, so its exchange rate is always 1.`,
      errors: [{ field: 'exchangeRate', message: 'Must be 1' }],
    });
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

  // Counts a purchase order's live invoices and flagged ones, and totals the quantity billed against the quantity ordered
  async findPurchaseOrderSummary(purchaseOrderId: string): Promise<PurchaseOrderInvoiceSummaryRow> {
    const liveInvoice = and(
      eq(supplierInvoices.purchaseOrderId, purchaseOrderId),
      ne(supplierInvoices.status, SupplierInvoiceStatusValues.CANCELLED),
    );
    const liveInvoiceIds = this.db.select({ id: supplierInvoices.id }).from(supplierInvoices).where(liveInvoice);
    const [row] = await this.db
      .select({
        invoiceCount: this.db.$count(supplierInvoices, liveInvoice),
        flaggedInvoiceCount: this.db.$count(supplierInvoices, and(liveInvoice, gt(supplierInvoices.flagCount, 0))),
        billedQty: sql<string>`(${this.db
          .select({ total: sql`coalesce(sum(${supplierInvoiceLines.billedQty}), 0)` })
          .from(supplierInvoiceLines)
          .where(inArray(supplierInvoiceLines.supplierInvoiceId, liveInvoiceIds))})`,
        orderedQty: sql<string>`(${this.db
          .select({ total: sql`coalesce(sum(${purchaseOrderItems.uomQty}), 0)` })
          .from(purchaseOrderItems)
          .where(eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId))})`,
      })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, purchaseOrderId));
    return row ?? { invoiceCount: 0, flaggedInvoiceCount: 0, billedQty: '0', orderedQty: '0' };
  }

  // Returns a purchase order's live invoices with at least one flag on the header or a line, newest first
  findFlaggedForPurchaseOrder(purchaseOrderId: string): Promise<SupplierInvoiceRow[]> {
    return this.findAllWithSelect<SupplierInvoiceRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: and(
        eq(supplierInvoices.purchaseOrderId, purchaseOrderId),
        ne(supplierInvoices.status, SupplierInvoiceStatusValues.CANCELLED),
        gt(supplierInvoices.flagCount, 0),
      ),
      orderBy: [desc(supplierInvoices.invoiceDate), desc(supplierInvoices.createdAt)],
    });
  }

  // Returns the live invoices of a purchase order with the order's rate, for matching
  findLiveForPurchaseOrder(purchaseOrderId: string): Promise<SupplierInvoiceRow[]> {
    return this.findAllWithSelect<SupplierInvoiceRow>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: and(
        eq(supplierInvoices.purchaseOrderId, purchaseOrderId),
        ne(supplierInvoices.status, SupplierInvoiceStatusValues.CANCELLED),
      ),
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { aliasedTable, and, asc, desc, eq, ne, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  goodsReceiptItems,
  goodsReceiptLots,
  goodsReceipts,
  inventoryItems,
  type NewSupplierInvoiceHold,
  purchaseOrderItems,
  purchaseOrders,
  type SupplierInvoiceHold,
  SupplierInvoiceHoldStatusValues,
  SupplierInvoiceLineTypeValues,
  type SupplierInvoiceStatus,
  SupplierInvoiceStatusValues,
  supplierEnrollments,
  supplierInvoiceHolds,
  supplierInvoiceLines,
  supplierInvoices,
  uom,
} from '@/db/schema';

const otherLines = aliasedTable(supplierInvoiceLines, 'other_invoice_lines');
const otherInvoices = aliasedTable(supplierInvoices, 'other_invoices');

export type HoldInvoiceFacts = {
  id: string;
  currencyCode: string;
  exchangeRate: number;
  priceTolerancePct: number;
  qtyTolerancePct: number;
  amountTolerance: bigint;
};

export type HoldLineFacts = {
  supplierInvoiceLineId: string;
  purchaseOrderItemId: string;
  inventoryItemName: string | null;
  uomSymbol: string | null;
  invoicedQty: number;
  freeQty: number;
  invoicedPrimaryQty: number;
  freePrimaryQty: number;
  unitPrice: bigint;
  poNumber: string;
  poExchangeRate: number;
  poUnitPrice: bigint;
  poPrimaryUomQty: number;
  poFreePrimaryQty: number;
  poCancelledPrimaryQty: number;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  otherPostedInvoicedPrimaryQty: number;
  lotNumber: string | null;
  lotExpiryDate: string | null;
  receivedDate: string | null;
};

export type PurchaseOrderInvoiceHoldRow = Pick<
  SupplierInvoiceHold,
  'id' | 'code' | 'detail' | 'blocksPayment' | 'supplierInvoiceId' | 'supplierInvoiceLineId'
> & {
  invoiceNumber: string;
  invoiceStatus: SupplierInvoiceStatus;
  purchaseOrderItemId: string | null;
  lotNumber: string | null;
};

@Injectable()
export class SupplierInvoiceHoldsDomainRepository extends PrimaryBaseRepository<typeof supplierInvoiceHolds> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierInvoiceHolds);
  }

  // Returns every hold of an invoice, oldest first
  findByInvoice(supplierInvoiceId: string): Promise<SupplierInvoiceHold[]> {
    return this.findAllWithSelect<SupplierInvoiceHold>({
      where: eq(supplierInvoiceHolds.supplierInvoiceId, supplierInvoiceId),
      orderBy: [asc(supplierInvoiceHolds.createdAt)],
    });
  }

  // Loads a hold of the given invoice
  findOnInvoice(supplierInvoiceId: string, id: string): Promise<SupplierInvoiceHold | undefined> {
    return this.findOne({ id, supplierInvoiceId });
  }

  // Loads the invoice's rate and currency with the tolerances of its supplier's enrollment at its site
  async findInvoiceFacts(supplierInvoiceId: string): Promise<HoldInvoiceFacts | undefined> {
    const [row] = await this.db
      .select({
        id: supplierInvoices.id,
        currencyCode: supplierInvoices.currencyCode,
        exchangeRate: supplierInvoices.exchangeRate,
        priceTolerancePct: sql<number>`coalesce(${supplierEnrollments.priceTolerancePct}, 0)`.mapWith(Number),
        qtyTolerancePct: sql<number>`coalesce(${supplierEnrollments.qtyTolerancePct}, 0)`.mapWith(Number),
        amountTolerance: sql<bigint>`coalesce(${supplierEnrollments.amountTolerance}, 0)`.mapWith(BigInt),
      })
      .from(supplierInvoices)
      .leftJoin(
        supplierEnrollments,
        and(
          eq(supplierEnrollments.supplierId, supplierInvoices.supplierId),
          eq(supplierEnrollments.siteId, supplierInvoices.siteId),
        ),
      )
      .where(eq(supplierInvoices.id, supplierInvoiceId))
      .limit(1);
    return row;
  }

  // Returns each item line of an invoice with its PO line's terms, what other posted invoices invoice of that PO line, and its receipt lot
  async findLineFacts(supplierInvoiceId: string): Promise<HoldLineFacts[]> {
    const otherPostedInvoiced = this.db
      .select({ total: sql`coalesce(sum(${otherLines.invoicedPrimaryQty} + ${otherLines.freePrimaryQty}), 0)` })
      .from(otherLines)
      .innerJoin(otherInvoices, eq(otherInvoices.id, otherLines.supplierInvoiceId))
      .where(
        and(
          eq(otherLines.purchaseOrderItemId, supplierInvoiceLines.purchaseOrderItemId),
          eq(otherInvoices.status, SupplierInvoiceStatusValues.POSTED),
          ne(otherLines.supplierInvoiceId, supplierInvoiceId),
        ),
      );
    const rows = await this.db
      .select({
        supplierInvoiceLineId: supplierInvoiceLines.id,
        purchaseOrderItemId: supplierInvoiceLines.purchaseOrderItemId,
        inventoryItemName: inventoryItems.name,
        uomSymbol: uom.symbol,
        invoicedQty: supplierInvoiceLines.invoicedQty,
        freeQty: supplierInvoiceLines.freeQty,
        invoicedPrimaryQty: supplierInvoiceLines.invoicedPrimaryQty,
        freePrimaryQty: supplierInvoiceLines.freePrimaryQty,
        unitPrice: supplierInvoiceLines.unitPrice,
        poNumber: purchaseOrders.poNumber,
        poExchangeRate: purchaseOrders.exchangeRate,
        poUnitPrice: purchaseOrderItems.unitPrice,
        poPrimaryUomQty: purchaseOrderItems.primaryUomQty,
        poFreePrimaryQty: purchaseOrderItems.freePrimaryQty,
        poCancelledPrimaryQty: purchaseOrderItems.cancelledPrimaryQty,
        schemeBuyQty: purchaseOrderItems.schemeBuyQty,
        schemeFreeQty: purchaseOrderItems.schemeFreeQty,
        hasScheme: purchaseOrderItems.hasScheme,
        otherPostedInvoicedPrimaryQty: sql<number>`(${otherPostedInvoiced})`.mapWith(Number),
        lotNumber: goodsReceiptLots.lotNumber,
        lotExpiryDate: goodsReceiptLots.expiryDate,
        receivedDate: goodsReceipts.receivedDate,
      })
      .from(supplierInvoiceLines)
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, supplierInvoiceLines.purchaseOrderItemId))
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .leftJoin(inventoryItems, eq(inventoryItems.id, supplierInvoiceLines.inventoryItemId))
      .leftJoin(uom, eq(uom.id, supplierInvoiceLines.uomId))
      .leftJoin(goodsReceiptItems, eq(goodsReceiptItems.id, supplierInvoiceLines.goodsReceiptItemId))
      .leftJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .leftJoin(goodsReceiptLots, eq(goodsReceiptLots.id, supplierInvoiceLines.goodsReceiptLotId))
      .where(
        and(
          eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoiceId),
          eq(supplierInvoiceLines.lineType, SupplierInvoiceLineTypeValues.ITEM),
        ),
      )
      .orderBy(asc(supplierInvoiceLines.createdAt));
    return rows as HoldLineFacts[];
  }

  // Inserts the given holds in one statement
  async insertMany(rows: NewSupplierInvoiceHold[]): Promise<void> {
    if (rows.length === 0) return;
    await this.db.insert(supplierInvoiceHolds).values(rows);
  }

  // Counts an invoice's open holds that block its payment
  countOpenBlocking(supplierInvoiceId: string): Promise<number> {
    return this.count(
      and(
        eq(supplierInvoiceHolds.supplierInvoiceId, supplierInvoiceId),
        eq(supplierInvoiceHolds.status, SupplierInvoiceHoldStatusValues.OPEN),
        eq(supplierInvoiceHolds.blocksPayment, true),
      ),
    );
  }

  // Returns the open holds of a purchase order's live invoices on lines invoicing it, newest invoice first
  findOpenForPurchaseOrder(purchaseOrderId: string): Promise<PurchaseOrderInvoiceHoldRow[]> {
    return this.db
      .select({
        id: supplierInvoiceHolds.id,
        code: supplierInvoiceHolds.code,
        detail: supplierInvoiceHolds.detail,
        blocksPayment: supplierInvoiceHolds.blocksPayment,
        supplierInvoiceId: supplierInvoiceHolds.supplierInvoiceId,
        supplierInvoiceLineId: supplierInvoiceHolds.supplierInvoiceLineId,
        invoiceNumber: supplierInvoices.invoiceNumber,
        invoiceStatus: supplierInvoices.status,
        purchaseOrderItemId: supplierInvoiceLines.purchaseOrderItemId,
        lotNumber: goodsReceiptLots.lotNumber,
      })
      .from(supplierInvoiceHolds)
      .innerJoin(supplierInvoices, eq(supplierInvoices.id, supplierInvoiceHolds.supplierInvoiceId))
      .innerJoin(supplierInvoiceLines, eq(supplierInvoiceLines.id, supplierInvoiceHolds.supplierInvoiceLineId))
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, supplierInvoiceLines.purchaseOrderItemId))
      .leftJoin(goodsReceiptLots, eq(goodsReceiptLots.id, supplierInvoiceLines.goodsReceiptLotId))
      .where(
        and(
          eq(purchaseOrderItems.purchaseOrderId, purchaseOrderId),
          eq(supplierInvoiceHolds.status, SupplierInvoiceHoldStatusValues.OPEN),
          ne(supplierInvoices.status, SupplierInvoiceStatusValues.CANCELLED),
        ),
      )
      .orderBy(
        desc(supplierInvoices.invoiceDate),
        desc(supplierInvoices.createdAt),
        asc(supplierInvoiceLines.createdAt),
      );
  }
}

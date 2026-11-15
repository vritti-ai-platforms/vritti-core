import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { aliasedTable, and, asc, eq, isNull, ne, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  currentSiteId,
  type GoodsReceiptStatus,
  GoodsReceiptStatusValues,
  goodsReceiptItems,
  goodsReceiptLines,
  goodsReceiptLots,
  goodsReceipts,
  inventoryItems,
  type PurchaseOrderStatus,
  purchaseOrderItems,
  purchaseOrders,
  SupplierInvoiceLineTypeValues,
  SupplierInvoiceStatusValues,
  supplierInvoiceLines,
  supplierInvoices,
  uom,
} from '@/db/schema';

const receiptUom = aliasedTable(uom, 'receipt_uom');
const invoicingLines = aliasedTable(supplierInvoiceLines, 'invoicing_lines');
const invoicingInvoices = aliasedTable(supplierInvoices, 'invoicing_invoices');

export type InvoiceableGoodsReceiptRow = {
  goodsReceiptId: string;
  grNumber: string;
  goodsReceiptStatus: GoodsReceiptStatus;
  receivedDate: string;
  goodsReceiptItemId: string;
  goodsReceiptLotId: string | null;
  lotNumber: string | null;
  expiryDate: string | null;
  mrp: bigint | null;
  lotCount: number;
  purchaseOrderId: string;
  poNumber: string;
  poStatus: PurchaseOrderStatus;
  poSupplierId: string;
  poSiteId: string;
  poCurrencyCode: string;
  poExchangeRate: number;
  purchaseOrderItemId: string;
  poUomQty: number;
  poPrimaryUomQty: number;
  poUnitPrice: bigint;
  inventoryItemId: string;
  inventoryItemName: string | null;
  uomId: string;
  uomSymbol: string | null;
  primaryUomSymbol: string | null;
  acceptedPrimaryQty: number;
  invoicedPrimaryQty: number;
};

export type InvoiceableGoodsReceiptFilter = {
  supplierId: string;
  siteId?: string;
  purchaseOrderId?: string;
  excludeLineId?: string;
};

@Injectable()
export class InvoiceableGoodsReceiptsRepository extends PrimaryBaseRepository<typeof goodsReceiptItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceiptItems);
  }

  // Returns the posted receipt lots (or items without lots) of a supplier's orders at a site with primary quantity
  // left to invoice, oldest receipt first
  async findInvoiceable(filter: InvoiceableGoodsReceiptFilter): Promise<InvoiceableGoodsReceiptRow[]> {
    const accepted = this.acceptedPrimary();
    const invoiced = this.invoicedPrimary(filter.excludeLineId);
    return this.db
      .select(this.selection(accepted, invoiced))
      .from(goodsReceiptItems)
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, goodsReceiptItems.purchaseOrderItemId))
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .innerJoin(inventoryItems, eq(inventoryItems.id, goodsReceiptItems.inventoryItemId))
      .leftJoin(receiptUom, eq(receiptUom.id, goodsReceiptItems.uomId))
      .leftJoin(uom, eq(uom.id, inventoryItems.uomId))
      .leftJoin(goodsReceiptLots, eq(goodsReceiptLots.goodsReceiptItemId, goodsReceiptItems.id))
      .where(
        and(
          eq(purchaseOrders.supplierId, filter.supplierId),
          eq(purchaseOrders.siteId, filter.siteId ?? currentSiteId()),
          eq(goodsReceipts.status, GoodsReceiptStatusValues.POSTED),
          filter.purchaseOrderId ? eq(purchaseOrders.id, filter.purchaseOrderId) : undefined,
          sql`${accepted} - ${invoiced} > 0`,
        ),
      )
      .orderBy(
        asc(goodsReceipts.receivedDate),
        asc(goodsReceipts.grNumber),
        asc(inventoryItems.name),
        asc(goodsReceiptLots.expiryDate),
      ) as Promise<InvoiceableGoodsReceiptRow[]>;
  }

  // Loads the receipt item a line invoices, with the given lot when it is one of the item's, and what the other live lines invoice of it
  async findForLine(
    goodsReceiptItemId: string,
    goodsReceiptLotId: string | null,
    excludeLineId?: string,
  ): Promise<InvoiceableGoodsReceiptRow | undefined> {
    const lotJoin = goodsReceiptLotId
      ? and(eq(goodsReceiptLots.id, goodsReceiptLotId), eq(goodsReceiptLots.goodsReceiptItemId, goodsReceiptItems.id))
      : sql`false`;
    const [row] = await this.db
      .select(this.selection(this.acceptedPrimary(), this.invoicedPrimary(excludeLineId)))
      .from(goodsReceiptItems)
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, goodsReceiptItems.purchaseOrderItemId))
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .innerJoin(inventoryItems, eq(inventoryItems.id, goodsReceiptItems.inventoryItemId))
      .leftJoin(receiptUom, eq(receiptUom.id, goodsReceiptItems.uomId))
      .leftJoin(uom, eq(uom.id, inventoryItems.uomId))
      .leftJoin(goodsReceiptLots, lotJoin as SQL)
      .where(eq(goodsReceiptItems.id, goodsReceiptItemId))
      .limit(1);
    return row as InvoiceableGoodsReceiptRow | undefined;
  }

  // Returns each receipt lot (or item without lots) an invoice's item lines invoice, with what every live line invoices of it
  async findInvoicedByInvoice(supplierInvoiceId: string): Promise<InvoiceableGoodsReceiptRow[]> {
    return this.db
      .selectDistinct(this.selection(this.acceptedPrimary(), this.invoicedPrimary()))
      .from(supplierInvoiceLines)
      .innerJoin(goodsReceiptItems, eq(goodsReceiptItems.id, supplierInvoiceLines.goodsReceiptItemId))
      .innerJoin(goodsReceipts, eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId))
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, goodsReceiptItems.purchaseOrderItemId))
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .innerJoin(inventoryItems, eq(inventoryItems.id, goodsReceiptItems.inventoryItemId))
      .leftJoin(receiptUom, eq(receiptUom.id, goodsReceiptItems.uomId))
      .leftJoin(uom, eq(uom.id, inventoryItems.uomId))
      .leftJoin(goodsReceiptLots, eq(goodsReceiptLots.id, supplierInvoiceLines.goodsReceiptLotId))
      .where(
        and(
          eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoiceId),
          eq(supplierInvoiceLines.lineType, SupplierInvoiceLineTypeValues.ITEM),
        ),
      ) as Promise<InvoiceableGoodsReceiptRow[]>;
  }

  // Selects a receipt lot (or item) with its receipt, purchase order line, units and the given accepted and invoiced quantities
  private selection(accepted: SQL, invoiced: SQL) {
    return {
      goodsReceiptId: goodsReceipts.id,
      grNumber: goodsReceipts.grNumber,
      goodsReceiptStatus: goodsReceipts.status,
      receivedDate: goodsReceipts.receivedDate,
      goodsReceiptItemId: goodsReceiptItems.id,
      goodsReceiptLotId: goodsReceiptLots.id,
      lotNumber: goodsReceiptLots.lotNumber,
      expiryDate: goodsReceiptLots.expiryDate,
      mrp: goodsReceiptLots.mrp,
      lotCount: this.db.$count(goodsReceiptLots, eq(goodsReceiptLots.goodsReceiptItemId, goodsReceiptItems.id)),
      purchaseOrderId: purchaseOrders.id,
      poNumber: purchaseOrders.poNumber,
      poStatus: purchaseOrders.status,
      poSupplierId: purchaseOrders.supplierId,
      poSiteId: purchaseOrders.siteId,
      poCurrencyCode: purchaseOrders.currencyCode,
      poExchangeRate: purchaseOrders.exchangeRate,
      purchaseOrderItemId: purchaseOrderItems.id,
      poUomQty: purchaseOrderItems.uomQty,
      poPrimaryUomQty: purchaseOrderItems.primaryUomQty,
      poUnitPrice: purchaseOrderItems.unitPrice,
      inventoryItemId: goodsReceiptItems.inventoryItemId,
      inventoryItemName: inventoryItems.name,
      uomId: goodsReceiptItems.uomId,
      uomSymbol: receiptUom.symbol,
      primaryUomSymbol: uom.symbol,
      acceptedPrimaryQty: sql<number>`${accepted}`.mapWith(Number),
      invoicedPrimaryQty: sql<number>`${invoiced}`.mapWith(Number),
    };
  }

  // What the joined lot (or, with no lot, the receipt item) put away: the primary quantity of its receipt lines
  private acceptedPrimary(): SQL {
    const putAway = (match: SQL) =>
      this.db
        .select({ total: sql`coalesce(sum(${goodsReceiptLines.primaryUomQty}), 0)` })
        .from(goodsReceiptLines)
        .where(match);
    return sql`(case when ${goodsReceiptLots.id} is null
      then (${putAway(eq(goodsReceiptLines.goodsReceiptItemId, goodsReceiptItems.id))})
      else (${putAway(eq(goodsReceiptLines.goodsReceiptLotId, goodsReceiptLots.id))})
    end)`;
  }

  // What the lines of live invoices invoice (invoiced + free, in primary units) of the joined lot, or of the receipt item when no lot is joined
  private invoicedPrimary(excludeLineId?: string): SQL {
    const invoicedBy = (match: SQL | undefined) =>
      this.db
        .select({
          total: sql`coalesce(sum(${invoicingLines.invoicedPrimaryQty} + ${invoicingLines.freePrimaryQty}), 0)`,
        })
        .from(invoicingLines)
        .innerJoin(invoicingInvoices, eq(invoicingInvoices.id, invoicingLines.supplierInvoiceId))
        .where(
          and(
            match,
            ne(invoicingInvoices.status, SupplierInvoiceStatusValues.CANCELLED),
            excludeLineId ? ne(invoicingLines.id, excludeLineId) : undefined,
          ),
        );
    return sql`(case when ${goodsReceiptLots.id} is null
      then (${invoicedBy(and(eq(invoicingLines.goodsReceiptItemId, goodsReceiptItems.id), isNull(invoicingLines.goodsReceiptLotId)))})
      else (${invoicedBy(eq(invoicingLines.goodsReceiptLotId, goodsReceiptLots.id))})
    end)`;
  }
}

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { aliasedTable, and, asc, eq, getColumns } from '@vritti/api-sdk/drizzle-orm';
import {
  type CostCategory,
  costCategories,
  goodsReceiptItems,
  goodsReceiptLots,
  goodsReceipts,
  inventoryItems,
  type NewSupplierInvoiceLine,
  purchaseOrderItems,
  purchaseOrders,
  type SupplierInvoiceLine,
  SupplierInvoiceLineTypeValues,
  supplierInvoiceLines,
  uom,
} from '@/db/schema';

const primaryUom = aliasedTable(uom, 'primary_uom');

export type SupplierInvoiceLineRow = SupplierInvoiceLine & {
  inventoryItemName: string | null;
  uomSymbol: string | null;
  primaryUomSymbol: string | null;
  purchaseOrderId: string | null;
  poNumber: string | null;
  goodsReceiptId: string | null;
  grNumber: string | null;
  lotNumber: string | null;
  expiryDate: string | null;
  mrp: bigint | null;
  costCategoryName: string | null;
};

export type SupplierInvoiceLineInvoicing = Pick<
  SupplierInvoiceLine,
  'purchaseOrderItemId' | 'invoicedPrimaryQty' | 'freePrimaryQty'
>;

@Injectable()
export class SupplierInvoiceLinesDomainRepository extends PrimaryBaseRepository<typeof supplierInvoiceLines> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierInvoiceLines);
  }

  // Returns an invoice's lines in entry order with the item, units, order, receipt lot and cost category they name
  findByInvoice(supplierInvoiceId: string): Promise<SupplierInvoiceLineRow[]> {
    return this.findAllWithSelect<SupplierInvoiceLineRow>({
      select: {
        ...getColumns(supplierInvoiceLines),
        inventoryItemName: inventoryItems.name,
        uomSymbol: uom.symbol,
        primaryUomSymbol: primaryUom.symbol,
        purchaseOrderId: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        goodsReceiptId: goodsReceipts.id,
        grNumber: goodsReceipts.grNumber,
        lotNumber: goodsReceiptLots.lotNumber,
        expiryDate: goodsReceiptLots.expiryDate,
        mrp: goodsReceiptLots.mrp,
        costCategoryName: costCategories.name,
      },
      leftJoins: [
        { table: inventoryItems, on: eq(inventoryItems.id, supplierInvoiceLines.inventoryItemId) },
        { table: uom, on: eq(uom.id, supplierInvoiceLines.uomId) },
        { table: primaryUom, on: eq(primaryUom.id, inventoryItems.uomId) },
        { table: purchaseOrderItems, on: eq(purchaseOrderItems.id, supplierInvoiceLines.purchaseOrderItemId) },
        { table: purchaseOrders, on: eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId) },
        { table: goodsReceiptItems, on: eq(goodsReceiptItems.id, supplierInvoiceLines.goodsReceiptItemId) },
        { table: goodsReceipts, on: eq(goodsReceipts.id, goodsReceiptItems.goodsReceiptId) },
        { table: goodsReceiptLots, on: eq(goodsReceiptLots.id, supplierInvoiceLines.goodsReceiptLotId) },
        { table: costCategories, on: eq(costCategories.id, supplierInvoiceLines.costCategoryId) },
      ],
      where: eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoiceId),
      orderBy: [asc(supplierInvoiceLines.createdAt)],
    });
  }

  // Loads a line only when it is on the invoice
  findOnInvoice(supplierInvoiceId: string, id: string): Promise<SupplierInvoiceLine | undefined> {
    return this.findById(id, { where: eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoiceId) });
  }

  // Returns the PO line and invoiced + free primary quantities of each item line of an invoice
  findInvoicing(supplierInvoiceId: string): Promise<SupplierInvoiceLineInvoicing[]> {
    return this.db
      .select({
        purchaseOrderItemId: supplierInvoiceLines.purchaseOrderItemId,
        invoicedPrimaryQty: supplierInvoiceLines.invoicedPrimaryQty,
        freePrimaryQty: supplierInvoiceLines.freePrimaryQty,
      })
      .from(supplierInvoiceLines)
      .where(
        and(
          eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoiceId),
          eq(supplierInvoiceLines.lineType, SupplierInvoiceLineTypeValues.ITEM),
        ),
      );
  }

  // Loads the cost category a charge line names
  async findCostCategory(costCategoryId: string): Promise<CostCategory | undefined> {
    const [category] = await this.db
      .select()
      .from(costCategories)
      .where(eq(costCategories.id, costCategoryId))
      .limit(1);
    return category;
  }

  // Inserts many lines in one statement
  async createMany(rows: NewSupplierInvoiceLine[]): Promise<void> {
    if (rows.length === 0) return;
    await this.db.insert(supplierInvoiceLines).values(rows);
  }

  // Deletes every line of an invoice
  async deleteByInvoice(supplierInvoiceId: string): Promise<void> {
    await this.deleteMany(eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoiceId));
  }

  // Clears the variance of every line of an invoice once its costing is reversed
  async clearVariance(supplierInvoiceId: string): Promise<void> {
    await this.updateMany(eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoiceId), { varianceAmount: 0n });
  }
}

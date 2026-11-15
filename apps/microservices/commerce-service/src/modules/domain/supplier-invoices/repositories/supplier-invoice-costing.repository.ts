import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { type AnyColumn, and, eq, exists, inArray, isNull, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { alias } from '@vritti/api-sdk/drizzle-pg-core';
import {
  CostCategoryKindValues,
  CostSourceTypeValues,
  costCategories,
  goodsReceiptLines,
  inventoryItemCosts,
  inventoryItemQuantCosts,
  inventoryItemQuants,
  purchaseOrderItems,
  purchaseOrders,
  SupplierInvoiceLineTypeValues,
  supplierInvoiceLines,
  supplierInvoices,
} from '@/db/schema';

const lotLines = alias(goodsReceiptLines, 'lot_lines');
const quantLines = alias(goodsReceiptLines, 'quant_lines');

export type CostingSlice = {
  supplierInvoiceLineId: string;
  invoicedQty: number;
  invoicedPrimaryQty: number;
  freePrimaryQty: number;
  unitPrice: bigint;
  discountAmount: bigint;
  currencyCode: string;
  exchangeRate: number;
  orderedPrimaryQty: number;
  orderedFreePrimaryQty: number;
  orderedTotalPrice: bigint;
  orderCurrencyCode: string;
  orderExchangeRate: number;
  invoicedReceiptPrimaryQty: number;
  receivedPrimaryQty: number;
  quantId: string;
  quantQuantity: number;
  quantInflowQty: number;
};

export type ChargeLine = {
  id: string;
  costCategoryId: string;
  unitPrice: bigint;
  discountAmount: bigint;
  currencyCode: string;
  exchangeRate: number;
};

export type ReceiptQuant = {
  quantId: string;
  receivedPrimaryQty: number;
  unitCost: bigint;
  quantQuantity: number;
  quantInflowQty: number;
};

export type ChargeAllocation = {
  quantId: string;
  allocatedAmount: bigint;
  quantQuantity: number;
  quantInflowQty: number;
};

@Injectable()
export class SupplierInvoiceCostingDomainRepository extends PrimaryBaseRepository<typeof supplierInvoiceLines> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierInvoiceLines);
  }

  // Returns one slice per goods receipt line of the lot (or item without lots) each item line invoices, with the
  // invoice line, order line and quant facts its costing needs
  async findCostingSlices(supplierInvoiceId: string): Promise<CostingSlice[]> {
    const invoicedReceipt = (receiptLines: typeof goodsReceiptLines | typeof lotLines): SQL =>
      and(
        eq(receiptLines.goodsReceiptItemId, supplierInvoiceLines.goodsReceiptItemId),
        or(
          isNull(supplierInvoiceLines.goodsReceiptLotId),
          eq(receiptLines.goodsReceiptLotId, supplierInvoiceLines.goodsReceiptLotId),
        ),
      ) as SQL;

    const rows = await this.db
      .select({
        supplierInvoiceLineId: supplierInvoiceLines.id,
        invoicedQty: supplierInvoiceLines.invoicedQty,
        invoicedPrimaryQty: supplierInvoiceLines.invoicedPrimaryQty,
        freePrimaryQty: supplierInvoiceLines.freePrimaryQty,
        unitPrice: supplierInvoiceLines.unitPrice,
        discountAmount: supplierInvoiceLines.discountAmount,
        currencyCode: supplierInvoices.currencyCode,
        exchangeRate: supplierInvoices.exchangeRate,
        orderedPrimaryQty: purchaseOrderItems.primaryUomQty,
        orderedFreePrimaryQty: purchaseOrderItems.freePrimaryQty,
        orderedTotalPrice: purchaseOrderItems.totalPrice,
        orderCurrencyCode: purchaseOrderItems.currencyCode,
        orderExchangeRate: purchaseOrders.exchangeRate,
        invoicedReceiptPrimaryQty: sql<number>`(${this.db
          .select({ total: sql`coalesce(sum(${lotLines.primaryUomQty}), 0)` })
          .from(lotLines)
          .where(invoicedReceipt(lotLines))})`.mapWith(Number),
        receivedPrimaryQty: goodsReceiptLines.primaryUomQty,
        quantId: inventoryItemQuants.id,
        quantQuantity: inventoryItemQuants.quantity,
        quantInflowQty: this.inflow(goodsReceiptLines.resolvedQuantId),
      })
      .from(supplierInvoiceLines)
      .innerJoin(supplierInvoices, eq(supplierInvoices.id, supplierInvoiceLines.supplierInvoiceId))
      .innerJoin(purchaseOrderItems, eq(purchaseOrderItems.id, supplierInvoiceLines.purchaseOrderItemId))
      .innerJoin(purchaseOrders, eq(purchaseOrders.id, purchaseOrderItems.purchaseOrderId))
      .innerJoin(goodsReceiptLines, invoicedReceipt(goodsReceiptLines))
      .innerJoin(inventoryItemQuants, eq(inventoryItemQuants.id, goodsReceiptLines.resolvedQuantId))
      .where(
        and(
          eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoiceId),
          eq(supplierInvoiceLines.lineType, SupplierInvoiceLineTypeValues.ITEM),
        ),
      );
    return rows as CostingSlice[];
  }

  // Returns the charge lines of an invoice with its currency and rate
  async findChargeLines(supplierInvoiceId: string): Promise<ChargeLine[]> {
    const rows = await this.db
      .select({
        id: supplierInvoiceLines.id,
        costCategoryId: supplierInvoiceLines.costCategoryId,
        unitPrice: supplierInvoiceLines.unitPrice,
        discountAmount: supplierInvoiceLines.discountAmount,
        currencyCode: supplierInvoices.currencyCode,
        exchangeRate: supplierInvoices.exchangeRate,
      })
      .from(supplierInvoiceLines)
      .innerJoin(supplierInvoices, eq(supplierInvoices.id, supplierInvoiceLines.supplierInvoiceId))
      .where(
        and(
          eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoiceId),
          eq(supplierInvoiceLines.lineType, SupplierInvoiceLineTypeValues.CHARGE),
        ),
      );
    return rows as ChargeLine[];
  }

  // Returns each quant the receipt lots (or items without lots) of an invoice's item lines landed in, with the primary
  // quantity they put into it, its unit cost and how much of its inflow is still on hand
  async findReceiptQuants(supplierInvoiceId: string): Promise<ReceiptQuant[]> {
    const invoicedByInvoice = this.db
      .select({ id: supplierInvoiceLines.id })
      .from(supplierInvoiceLines)
      .where(
        and(
          eq(supplierInvoiceLines.supplierInvoiceId, supplierInvoiceId),
          eq(supplierInvoiceLines.lineType, SupplierInvoiceLineTypeValues.ITEM),
          eq(supplierInvoiceLines.goodsReceiptItemId, goodsReceiptLines.goodsReceiptItemId),
          or(
            isNull(supplierInvoiceLines.goodsReceiptLotId),
            eq(supplierInvoiceLines.goodsReceiptLotId, goodsReceiptLines.goodsReceiptLotId),
          ),
        ),
      );
    return this.db
      .select({
        quantId: inventoryItemQuants.id,
        receivedPrimaryQty: sql<number>`sum(${goodsReceiptLines.primaryUomQty})`.mapWith(Number),
        unitCost: inventoryItemQuants.unitCost,
        quantQuantity: inventoryItemQuants.quantity,
        quantInflowQty: this.inflow(inventoryItemQuants.id),
      })
      .from(goodsReceiptLines)
      .innerJoin(inventoryItemQuants, eq(inventoryItemQuants.id, goodsReceiptLines.resolvedQuantId))
      .where(exists(invoicedByInvoice))
      .groupBy(inventoryItemQuants.id, inventoryItemQuants.unitCost, inventoryItemQuants.quantity);
  }

  // Returns the quant allocations of the costs booked by the given sources, with each quant's on-hand facts
  async findAllocationsBySources(sourceIds: string[]): Promise<ChargeAllocation[]> {
    if (sourceIds.length === 0) return [];
    return this.db
      .select({
        quantId: inventoryItemQuantCosts.quantId,
        allocatedAmount: inventoryItemQuantCosts.allocatedAmount,
        quantQuantity: inventoryItemQuants.quantity,
        quantInflowQty: this.inflow(inventoryItemQuantCosts.quantId),
      })
      .from(inventoryItemQuantCosts)
      .innerJoin(inventoryItemCosts, eq(inventoryItemCosts.id, inventoryItemQuantCosts.costId))
      .innerJoin(inventoryItemQuants, eq(inventoryItemQuants.id, inventoryItemQuantCosts.quantId))
      .where(this.bookedBy(sourceIds));
  }

  // Resolves the org's single ITEM-kind cost category, which item costs are booked under
  async findItemCategoryId(): Promise<string | null> {
    const [category] = await this.db
      .select({ id: costCategories.id })
      .from(costCategories)
      .where(eq(costCategories.kind, CostCategoryKindValues.ITEM))
      .limit(1);
    return category?.id ?? null;
  }

  // Matches the supplier invoice costs booked by the given sources
  private bookedBy(sourceIds: string[]): SQL {
    return and(
      eq(inventoryItemCosts.sourceType, CostSourceTypeValues.SUPPLIER_INVOICE),
      inArray(inventoryItemCosts.sourceId, sourceIds),
    ) as SQL;
  }

  // Sums the primary quantity every receipt line put into the quant
  private inflow(quantId: AnyColumn) {
    return sql<number>`(${this.db
      .select({ total: sql`coalesce(sum(${quantLines.primaryUomQty}), 0)` })
      .from(quantLines)
      .where(eq(quantLines.resolvedQuantId, quantId))})`.mapWith(Number);
  }
}

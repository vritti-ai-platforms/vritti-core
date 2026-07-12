import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type GoodsReceipt,
  goodsReceiptNumberSeq,
  goodsReceipts,
  type NewGoodsReceipt,
  type PurchaseOrderStatus,
  purchaseOrderItems,
  purchaseOrders,
  type Supplier,
  suppliers,
} from '@/db/schema';

// GR row joined with supplier + purchase-order display fields. Supplier fields are non-null in
// practice (supplier_id is a required FK) but left-joined; PO fields are null when no PO is linked.
export type GoodsReceiptWithRefs = GoodsReceipt & {
  supplierName: string | null;
  supplierCurrencyCode: string | null;
  poNumber: string | null;
  poOrderDate: string | null;
  poExpectedBy: string | null;
  poTotalAmount: bigint | null;
  poCurrencyCode: string | null;
};

// Table rows carry the same refs minus the supplier currency (not needed in list views).
export type GoodsReceiptTableRow = Omit<GoodsReceiptWithRefs, 'supplierCurrencyCode'>;

@Injectable()
export class GoodsReceiptsRepository extends PrimaryBaseRepository<typeof goodsReceipts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceipts, { sequence: goodsReceiptNumberSeq });
  }

  async generateGrNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextNumber = await this.nextSequenceValue();
    return `GR-${yearMonth}-${String(nextNumber).padStart(4, '0')}`;
  }

  async create(data: Omit<NewGoodsReceipt, 'grNumber'>): Promise<GoodsReceipt> {
    const grNumber = await this.generateGrNumber();
    return super.create({ ...data, grNumber });
  }

  async findForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: GoodsReceiptTableRow[];
    count: number;
  }> {
    return this.findAllAndCount({
      select: {
        id: goodsReceipts.id,
        organizationId: goodsReceipts.organizationId,
        siteId: goodsReceipts.siteId,
        supplierId: goodsReceipts.supplierId,
        grNumber: goodsReceipts.grNumber,
        status: goodsReceipts.status,
        purchaseOrderId: goodsReceipts.purchaseOrderId,
        exchangeRate: goodsReceipts.exchangeRate,
        receivedDate: goodsReceipts.receivedDate,
        notes: goodsReceipts.notes,
        metadata: goodsReceipts.metadata,
        publishedAt: goodsReceipts.publishedAt,
        createdAt: goodsReceipts.createdAt,
        supplierName: suppliers.name,
        poNumber: purchaseOrders.poNumber,
        poOrderDate: purchaseOrders.orderDate,
        poExpectedBy: purchaseOrders.expectedBy,
        poTotalAmount: purchaseOrders.totalAmount,
        poCurrencyCode: purchaseOrders.currencyCode,
      },
      leftJoins: [
        { table: suppliers, on: eq(goodsReceipts.supplierId, suppliers.id) },
        { table: purchaseOrders, on: eq(goodsReceipts.purchaseOrderId, purchaseOrders.id) },
      ],
      where: options.where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(goodsReceipts.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  async findForTableByPoId(
    poId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{
    result: GoodsReceiptTableRow[];
    count: number;
  }> {
    return this.findAllAndCount({
      select: {
        id: goodsReceipts.id,
        organizationId: goodsReceipts.organizationId,
        siteId: goodsReceipts.siteId,
        supplierId: goodsReceipts.supplierId,
        grNumber: goodsReceipts.grNumber,
        status: goodsReceipts.status,
        purchaseOrderId: goodsReceipts.purchaseOrderId,
        exchangeRate: goodsReceipts.exchangeRate,
        receivedDate: goodsReceipts.receivedDate,
        notes: goodsReceipts.notes,
        metadata: goodsReceipts.metadata,
        publishedAt: goodsReceipts.publishedAt,
        createdAt: goodsReceipts.createdAt,
        supplierName: suppliers.name,
        poNumber: purchaseOrders.poNumber,
        poOrderDate: purchaseOrders.orderDate,
        poExpectedBy: purchaseOrders.expectedBy,
        poTotalAmount: purchaseOrders.totalAmount,
        poCurrencyCode: purchaseOrders.currencyCode,
      },
      leftJoins: [
        { table: suppliers, on: eq(goodsReceipts.supplierId, suppliers.id) },
        { table: purchaseOrders, on: eq(goodsReceipts.purchaseOrderId, purchaseOrders.id) },
      ],
      where: and(eq(goodsReceipts.purchaseOrderId, poId), options.where),
      orderBy: options.orderBy?.length ? options.orderBy : [desc(goodsReceipts.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns up to limit+1 GR rows (keyset) joined with supplier + PO display fields, for the mobile feed.
  // Same joins as findForTable but goes through findKeyset (limit+1 / hasMore) instead of offset count.
  async findKeysetForFeed(options: { where?: SQL; orderBy: SQL[]; limit: number }): Promise<{
    rows: GoodsReceiptWithRefs[];
    hasMore: boolean;
  }> {
    return this.findKeyset<GoodsReceiptWithRefs>({
      select: {
        ...goodsReceipts,
        supplierName: suppliers.name,
        supplierCurrencyCode: suppliers.currencyCode,
        poNumber: purchaseOrders.poNumber,
        poOrderDate: purchaseOrders.orderDate,
        poExpectedBy: purchaseOrders.expectedBy,
        poTotalAmount: purchaseOrders.totalAmount,
        poCurrencyCode: purchaseOrders.currencyCode,
      },
      leftJoins: [
        { table: suppliers, on: eq(goodsReceipts.supplierId, suppliers.id) },
        { table: purchaseOrders, on: eq(goodsReceipts.purchaseOrderId, purchaseOrders.id) },
      ],
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
    });
  }

  async findSupplierById(id: string): Promise<Supplier | null> {
    const [row] = await this.db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    return row ?? null;
  }

  async findByIdWithRefs(id: string): Promise<GoodsReceiptWithRefs | null> {
    const [row] = await this.db
      .select({
        id: goodsReceipts.id,
        organizationId: goodsReceipts.organizationId,
        siteId: goodsReceipts.siteId,
        supplierId: goodsReceipts.supplierId,
        grNumber: goodsReceipts.grNumber,
        status: goodsReceipts.status,
        purchaseOrderId: goodsReceipts.purchaseOrderId,
        exchangeRate: goodsReceipts.exchangeRate,
        receivedDate: goodsReceipts.receivedDate,
        notes: goodsReceipts.notes,
        metadata: goodsReceipts.metadata,
        publishedAt: goodsReceipts.publishedAt,
        createdAt: goodsReceipts.createdAt,
        supplierName: suppliers.name,
        supplierCurrencyCode: suppliers.currencyCode,
        poNumber: purchaseOrders.poNumber,
        poOrderDate: purchaseOrders.orderDate,
        poExpectedBy: purchaseOrders.expectedBy,
        poTotalAmount: purchaseOrders.totalAmount,
        poCurrencyCode: purchaseOrders.currencyCode,
      })
      .from(goodsReceipts)
      .leftJoin(suppliers, eq(goodsReceipts.supplierId, suppliers.id))
      .leftJoin(purchaseOrders, eq(goodsReceipts.purchaseOrderId, purchaseOrders.id))
      .where(eq(goodsReceipts.id, id))
      .limit(1);
    return row ?? null;
  }

  async updatePoItemReceivedQty(poItemId: string, addQty: number): Promise<void> {
    await this.db
      .update(purchaseOrderItems)
      .set({
        receivedQuantity: sql`${purchaseOrderItems.receivedQuantity} + ${addQty}`,
      })
      .where(eq(purchaseOrderItems.id, poItemId));
  }

  async getPoTotals(poId: string): Promise<{ uomQty: number; receivedQuantity: number }> {
    const [row] = await this.db
      .select({
        uomQty: sql<string>`COALESCE(SUM(${purchaseOrderItems.uomQty}), 0)`,
        receivedQuantity: sql<string>`COALESCE(SUM(${purchaseOrderItems.receivedQuantity}), 0)`,
      })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, poId));

    return {
      uomQty: Number(row?.uomQty ?? 0),
      receivedQuantity: Number(row?.receivedQuantity ?? 0),
    };
  }

  async updatePoStatus(poId: string, status: PurchaseOrderStatus): Promise<void> {
    await this.db.update(purchaseOrders).set({ status }).where(eq(purchaseOrders.id, poId));
  }

  async existsByPoId(poId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ exists: sql<boolean>`true` })
      .from(goodsReceipts)
      .where(eq(goodsReceipts.purchaseOrderId, poId))
      .limit(1);
    return !!row;
  }

  async updateStatus(id: string, status: GoodsReceipt['status'], publishedAt?: Date): Promise<void> {
    await this.db
      .update(goodsReceipts)
      .set({
        status,
        ...(publishedAt ? { publishedAt } : {}),
      })
      .where(eq(goodsReceipts.id, id));
  }
}

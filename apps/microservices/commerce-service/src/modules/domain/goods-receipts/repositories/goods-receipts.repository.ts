import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  goodsReceiptNumberSeq,
  type NewGoodsReceipt,
  goodsReceipts,
  purchaseOrderItems,
  type PurchaseOrderStatus,
  purchaseOrders,
  suppliers,
} from '@/db/schema';

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

  async create(data: Omit<NewGoodsReceipt, 'grNumber'>): Promise<typeof goodsReceipts.$inferSelect> {
    const grNumber = await this.generateGrNumber();
    return super.create({ ...data, grNumber });
  }

  async findForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: (typeof goodsReceipts.$inferSelect & {
      supplierName: string | null;
      poNumber: string | null;
      poOrderDate: string | null;
      poExpectedBy: string | null;
      poTotalAmount: bigint | null;
      poCurrencyCode: string | null;
    })[];
    count: number;
  }> {
    return this.findAllAndCount({
      select: {
        id: goodsReceipts.id,
        organizationId: goodsReceipts.organizationId,
        businessUnitId: goodsReceipts.businessUnitId,
        supplierId: goodsReceipts.supplierId,
        grNumber: goodsReceipts.grNumber,
        status: goodsReceipts.status,
        purchaseOrderId: goodsReceipts.purchaseOrderId,
        receivedBy: goodsReceipts.receivedBy,
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
    result: (typeof goodsReceipts.$inferSelect & {
      supplierName: string | null;
      poNumber: string | null;
      poOrderDate: string | null;
      poExpectedBy: string | null;
      poTotalAmount: bigint | null;
      poCurrencyCode: string | null;
    })[];
    count: number;
  }> {
    return this.findAllAndCount({
      select: {
        id: goodsReceipts.id,
        organizationId: goodsReceipts.organizationId,
        businessUnitId: goodsReceipts.businessUnitId,
        supplierId: goodsReceipts.supplierId,
        grNumber: goodsReceipts.grNumber,
        status: goodsReceipts.status,
        purchaseOrderId: goodsReceipts.purchaseOrderId,
        receivedBy: goodsReceipts.receivedBy,
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

  async findSupplierById(id: string): Promise<typeof suppliers.$inferSelect | null> {
    const rows = await this.db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    return rows[0] ?? null;
  }

  async findByIdWithRefs(
    id: string,
  ): Promise<
    | (typeof goodsReceipts.$inferSelect & {
        supplierName: string | null;
        poNumber: string | null;
        poOrderDate: string | null;
        poExpectedBy: string | null;
        poTotalAmount: bigint | null;
        poCurrencyCode: string | null;
      })
    | null
  > {
    const rows = await this.db
      .select({
        id: goodsReceipts.id,
        organizationId: goodsReceipts.organizationId,
        businessUnitId: goodsReceipts.businessUnitId,
        supplierId: goodsReceipts.supplierId,
        grNumber: goodsReceipts.grNumber,
        status: goodsReceipts.status,
        purchaseOrderId: goodsReceipts.purchaseOrderId,
        receivedBy: goodsReceipts.receivedBy,
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
      })
      .from(goodsReceipts)
      .leftJoin(suppliers, eq(goodsReceipts.supplierId, suppliers.id))
      .leftJoin(purchaseOrders, eq(goodsReceipts.purchaseOrderId, purchaseOrders.id))
      .where(eq(goodsReceipts.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async updatePoItemReceivedQty(poItemId: string, addQty: number): Promise<void> {
    await this.db
      .update(purchaseOrderItems)
      .set({
        receivedQuantity: sql`${purchaseOrderItems.receivedQuantity} + ${String(addQty)}`,
      })
      .where(eq(purchaseOrderItems.id, poItemId));
  }

  async getPoTotals(poId: string): Promise<{ orderedQuantity: number; receivedQuantity: number }> {
    const [row] = await this.db
      .select({
        orderedQuantity: sql<string>`COALESCE(SUM(${purchaseOrderItems.orderedQuantity}), 0)`,
        receivedQuantity: sql<string>`COALESCE(SUM(${purchaseOrderItems.receivedQuantity}), 0)`,
      })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, poId));

    return {
      orderedQuantity: Number(row?.orderedQuantity ?? 0),
      receivedQuantity: Number(row?.receivedQuantity ?? 0),
    };
  }

  async updatePoStatus(poId: string, status: PurchaseOrderStatus): Promise<void> {
    await this.db.update(purchaseOrders).set({ status }).where(eq(purchaseOrders.id, poId));
  }

  async updateStatus(
    id: string,
    status: (typeof goodsReceipts.$inferSelect)['status'],
    publishedAt?: Date,
  ): Promise<void> {
    await this.db
      .update(goodsReceipts)
      .set({
        status,
        ...(publishedAt ? { publishedAt } : {}),
      })
      .where(eq(goodsReceipts.id, id));
  }
}

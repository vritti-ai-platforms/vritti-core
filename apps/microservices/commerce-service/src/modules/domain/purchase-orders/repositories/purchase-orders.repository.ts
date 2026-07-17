import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { parties, purchaseOrderItems, purchaseOrderNumberSeq, purchaseOrders, suppliers } from '@/db/schema';

@Injectable()
export class PurchaseOrdersRepository extends PrimaryBaseRepository<typeof purchaseOrders> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseOrders, { sequence: purchaseOrderNumberSeq });
  }

  // Generates a sequential PO number
  async generatePoNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextNumber = await this.nextSequenceValue();
    return `PO-${yearMonth}-${String(nextNumber).padStart(4, '0')}`;
  }

  // Returns PO with supplier name for detail endpoint
  async findByIdWithSupplierName(
    id: string,
  ): Promise<(typeof purchaseOrders.$inferSelect & { supplierName: string | null }) | null> {
    const [row] = await this.db
      .select({
        id: purchaseOrders.id,
        organizationId: purchaseOrders.organizationId,
        siteId: purchaseOrders.siteId,
        supplierId: purchaseOrders.supplierId,
        poNumber: purchaseOrders.poNumber,
        status: purchaseOrders.status,
        currencyCode: purchaseOrders.currencyCode,
        exchangeRate: purchaseOrders.exchangeRate,
        exchangeRateType: purchaseOrders.exchangeRateType,
        orderDate: purchaseOrders.orderDate,
        expectedBy: purchaseOrders.expectedBy,
        timezone: purchaseOrders.timezone,
        notes: purchaseOrders.notes,
        totalAmount: purchaseOrders.totalAmount,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
        supplierName: parties.displayName,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .leftJoin(parties, eq(suppliers.partyId, parties.id))
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    return row ?? null;
  }

  // Returns paginated POs with supplier name for table view
  async findForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: (typeof purchaseOrders.$inferSelect & { supplierName: string | null })[];
    count: number;
  }> {
    return this.findAllAndCount<typeof purchaseOrders.$inferSelect & { supplierName: string | null }>({
      select: {
        id: purchaseOrders.id,
        organizationId: purchaseOrders.organizationId,
        siteId: purchaseOrders.siteId,
        supplierId: purchaseOrders.supplierId,
        poNumber: purchaseOrders.poNumber,
        status: purchaseOrders.status,
        currencyCode: purchaseOrders.currencyCode,
        exchangeRate: purchaseOrders.exchangeRate,
        exchangeRateType: purchaseOrders.exchangeRateType,
        orderDate: purchaseOrders.orderDate,
        expectedBy: purchaseOrders.expectedBy,
        timezone: purchaseOrders.timezone,
        notes: purchaseOrders.notes,
        totalAmount: purchaseOrders.totalAmount,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
        supplierName: parties.displayName,
      },
      leftJoins: [
        { table: suppliers, on: eq(purchaseOrders.supplierId, suppliers.id) },
        { table: parties, on: eq(suppliers.partyId, parties.id) },
      ],
      where: options.where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(purchaseOrders.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Recalculates and persists totalAmount from the sum of all line item totalPrices
  async syncTotalAmount(id: string): Promise<void> {
    await this.db
      .update(purchaseOrders)
      .set({
        totalAmount: sql`(SELECT COALESCE(SUM(${purchaseOrderItems.totalPrice}), 0) FROM ${purchaseOrderItems} WHERE ${purchaseOrderItems.purchaseOrderId} = ${id})`,
      })
      .where(eq(purchaseOrders.id, id));
  }
}

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { purchaseOrderItems, purchaseOrderNumberSeq, purchaseOrders, suppliers } from '@/db/schema';

@Injectable()
export class PurchaseOrdersRepository extends PrimaryBaseRepository<typeof purchaseOrders> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseOrders, { sequence: purchaseOrderNumberSeq });
  }

  // Updates PO currency and conversion rate
  async updateCurrency(
    id: string,
    data: { currencyCode: string; conversionRate: string },
  ): Promise<typeof purchaseOrders.$inferSelect | null> {
    const [row] = await this.db
      .update(purchaseOrders)
      .set({
        currencyCode: data.currencyCode,
        conversionRate: data.conversionRate,
      })
      .where(eq(purchaseOrders.id, id))
      .returning();

    return row ?? null;
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
  ): Promise<
    (typeof purchaseOrders.$inferSelect & { supplierName: string | null; supplierCurrencyCode: string | null }) | null
  > {
    const [row] = await this.db
      .select({
        id: purchaseOrders.id,
        organizationId: purchaseOrders.organizationId,
        businessUnitId: purchaseOrders.businessUnitId,
        supplierId: purchaseOrders.supplierId,
        poNumber: purchaseOrders.poNumber,
        status: purchaseOrders.status,
        currencyCode: purchaseOrders.currencyCode,
        conversionRate: purchaseOrders.conversionRate,
        orderDate: purchaseOrders.orderDate,
        expectedBy: purchaseOrders.expectedBy,
        timezone: purchaseOrders.timezone,
        notes: purchaseOrders.notes,
        totalAmount: purchaseOrders.totalAmount,
        createdBy: purchaseOrders.createdBy,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
        supplierName: suppliers.name,
        supplierCurrencyCode: suppliers.currencyCode,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    return row ?? null;
  }

  // Returns paginated POs with supplier name for table view
  async findForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: (typeof purchaseOrders.$inferSelect & {
      supplierName: string | null;
      supplierCurrencyCode: string | null;
    })[];
    count: number;
  }> {
    return this.findAllAndCount<
      typeof purchaseOrders.$inferSelect & { supplierName: string | null; supplierCurrencyCode: string | null }
    >({
      select: {
        id: purchaseOrders.id,
        organizationId: purchaseOrders.organizationId,
        businessUnitId: purchaseOrders.businessUnitId,
        supplierId: purchaseOrders.supplierId,
        poNumber: purchaseOrders.poNumber,
        status: purchaseOrders.status,
        currencyCode: purchaseOrders.currencyCode,
        conversionRate: purchaseOrders.conversionRate,
        orderDate: purchaseOrders.orderDate,
        expectedBy: purchaseOrders.expectedBy,
        timezone: purchaseOrders.timezone,
        notes: purchaseOrders.notes,
        totalAmount: purchaseOrders.totalAmount,
        createdBy: purchaseOrders.createdBy,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
        supplierName: suppliers.name,
        supplierCurrencyCode: suppliers.currencyCode,
      },
      leftJoins: [{ table: suppliers, on: eq(purchaseOrders.supplierId, suppliers.id) }],
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

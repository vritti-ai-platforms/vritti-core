import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService, type TypedDrizzleClient } from '@vritti/api-sdk';
import { and, desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  inventoryItemBatches,
  inventoryItems,
  type NewStockAdjustment,
  type StockAdjustment,
  type StockAdjustmentStatus,
  stockAdjustments,
} from '@/db/schema';

@Injectable()
export class StockAdjustmentsRepository extends PrimaryBaseRepository<typeof stockAdjustments> {
  constructor(database: PrimaryDatabaseService) {
    super(database, stockAdjustments);
  }

  async findAllForTable(options: {
    where?: SQL;
    orderBy?: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: (StockAdjustment & { inventoryItemName: string | null })[]; count: number }> {
    return this.findAllAndCount<StockAdjustment & { inventoryItemName: string | null }>({
      select: {
        id: stockAdjustments.id,
        organizationId: stockAdjustments.organizationId,
        businessUnitId: stockAdjustments.businessUnitId,
        inventoryItemId: stockAdjustments.inventoryItemId,
        code: stockAdjustments.code,
        type: stockAdjustments.type,
        status: stockAdjustments.status,
        reason: stockAdjustments.reason,
        createdById: stockAdjustments.createdById,
        publishedAt: stockAdjustments.publishedAt,
        createdAt: stockAdjustments.createdAt,
        inventoryItemName: inventoryItems.name,
      },
      leftJoin: { table: inventoryItems, on: eq(stockAdjustments.inventoryItemId, inventoryItems.id) },
      where: options.where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(stockAdjustments.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  async findByIdWithItemName(
    id: string,
  ): Promise<(StockAdjustment & { inventoryItemName: string | null }) | undefined> {
    const rows = await this.db
      .select({
        id: stockAdjustments.id,
        organizationId: stockAdjustments.organizationId,
        businessUnitId: stockAdjustments.businessUnitId,
        inventoryItemId: stockAdjustments.inventoryItemId,
        code: stockAdjustments.code,
        type: stockAdjustments.type,
        status: stockAdjustments.status,
        reason: stockAdjustments.reason,
        createdById: stockAdjustments.createdById,
        publishedAt: stockAdjustments.publishedAt,
        createdAt: stockAdjustments.createdAt,
        inventoryItemName: inventoryItems.name,
      })
      .from(stockAdjustments)
      .leftJoin(inventoryItems, eq(stockAdjustments.inventoryItemId, inventoryItems.id))
      .where(eq(stockAdjustments.id, id));

    return rows[0] as (StockAdjustment & { inventoryItemName: string | null }) | undefined;
  }

  async updateStatusInTx(
    tx: TypedDrizzleClient,
    id: string,
    status: StockAdjustmentStatus,
    publishedAt?: Date,
  ): Promise<void> {
    await tx
      .update(stockAdjustments)
      .set({ status, ...(publishedAt ? { publishedAt } : {}) })
      .where(eq(stockAdjustments.id, id));
  }

  // Returns the item code for batch number generation
  async findItemCode(itemId: string): Promise<string> {
    const [row] = await this.db
      .select({ code: inventoryItems.code })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId));

    return row?.code ?? '';
  }

  // Counts batches for an item on a given date (org-scoped via RLS)
  async countBatchesForItemOnDate(itemId: string, date: string): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryItemBatches)
      .where(and(
        eq(inventoryItemBatches.inventoryItemId, itemId),
        eq(inventoryItemBatches.manufacturingDate, date),
      ));

    return Number(result?.count ?? 0);
  }

  // Generates a unique stock adjustment code (org-scoped via RLS)
  async generateCode(): Promise<string> {
    const result = await this.db.select({ count: sql<number>`count(*)` }).from(stockAdjustments);
    const count = Number(result[0]?.count ?? 0);
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    return `SA-${yearMonth}-${String(count + 1).padStart(4, '0')}`;
  }

  // Creates a stock adjustment with an auto-generated code
  async create(data: Omit<NewStockAdjustment, 'code'>): Promise<StockAdjustment> {
    const code = await this.generateCode();
    return super.create({ ...data, code });
  }

  async deleteById(id: string): Promise<void> {
    await this.db.delete(stockAdjustments).where(eq(stockAdjustments.id, id));
  }
}

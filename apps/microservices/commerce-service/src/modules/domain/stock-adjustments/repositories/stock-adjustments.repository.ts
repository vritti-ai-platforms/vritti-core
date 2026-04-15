import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService, type TypedDrizzleClient } from '@vritti/api-sdk';
import { desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { uuid, varchar } from '@vritti/api-sdk/drizzle-pg-core';
import {
  coreSchema,
  inventoryItems,
  type NewStockAdjustment,
  stockAdjustmentLines,
  type StockAdjustment,
  type StockAdjustmentStatus,
  stockAdjustments,
  uom,
} from '@/db/schema';

const users = coreSchema.table('users', {
  id: uuid('id').primaryKey(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
});

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
  }): Promise<{
    result: (StockAdjustment & {
      inventoryItemName: string;
      createdByFullName: string;
    })[];
    count: number;
  }> {
    return this.findAllAndCount<
      StockAdjustment & {
        inventoryItemName: string;
        inventoryItemUomSymbol: string | null;
        createdByFullName: string;
      }
    >({
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
        inventoryItemUomSymbol: uom.symbol,
        createdByFullName: users.fullName,
      },
      leftJoins: [
        { table: inventoryItems, on: eq(stockAdjustments.inventoryItemId, inventoryItems.id) },
        { table: uom, on: eq(inventoryItems.uomId, uom.id) },
        { table: users, on: eq(stockAdjustments.createdById, users.id) },
      ],
      where: options.where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(stockAdjustments.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  async findByIdWithItemName(
    id: string,
  ): Promise<
      (StockAdjustment & {
        inventoryItemName: string;
        inventoryItemUomSymbol: string | null;
        createdByFullName: string;
        isPublishable: boolean;
      }) | undefined
  > {
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
        inventoryItemUomSymbol: uom.symbol,
        createdByFullName: users.fullName,
        isPublishable: sql<boolean>`(
          ${stockAdjustments.status} = 'DRAFT'
          AND COUNT(DISTINCT ${stockAdjustmentLines.id}) > 0
          AND COUNT(DISTINCT ${stockAdjustmentLines.id}) =
              COUNT(DISTINCT CASE WHEN ${stockAdjustmentLines.isBalanced} THEN ${stockAdjustmentLines.id} END)
        )`,
      })
      .from(stockAdjustments)
      .innerJoin(inventoryItems, eq(stockAdjustments.inventoryItemId, inventoryItems.id))
      .leftJoin(uom, eq(inventoryItems.uomId, uom.id))
      .innerJoin(users, eq(stockAdjustments.createdById, users.id))
      .leftJoin(stockAdjustmentLines, eq(stockAdjustments.id, stockAdjustmentLines.stockAdjustmentId))
      .where(eq(stockAdjustments.id, id))
      .groupBy(
        stockAdjustments.id,
        stockAdjustments.organizationId,
        stockAdjustments.businessUnitId,
        stockAdjustments.inventoryItemId,
        stockAdjustments.code,
        stockAdjustments.type,
        stockAdjustments.status,
        stockAdjustments.reason,
        stockAdjustments.createdById,
        stockAdjustments.publishedAt,
        stockAdjustments.createdAt,
        inventoryItems.name,
        uom.symbol,
        users.fullName,
      );

    return rows[0] as
      | (StockAdjustment & {
          inventoryItemName: string;
          inventoryItemUomSymbol: string | null;
          createdByFullName: string;
          isPublishable: boolean;
        })
      | undefined;
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

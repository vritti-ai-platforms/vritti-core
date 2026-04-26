import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService, type TypedDrizzleClient } from '@vritti/api-sdk';
import { desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  inventoryItems,
  type NewStockAdjustment,
  type StockAdjustment,
  type StockAdjustmentStatus,
  stockAdjustmentCodeSeq,
  stockAdjustmentLines,
  stockAdjustments,
  uom,
} from '@/db/schema';

export type StockAdjustmentWithRefs = StockAdjustment & {
  inventoryItemName: string;
  inventoryItemUomSymbol: string | null;
  inventoryItemTracking: 'quantity' | 'lot' | 'serial';
  totalQuantity: number;
  isPublishable: boolean;
};

@Injectable()
export class StockAdjustmentsRepository extends PrimaryBaseRepository<typeof stockAdjustments> {
  constructor(database: PrimaryDatabaseService) {
    super(database, stockAdjustments, { sequence: stockAdjustmentCodeSeq });
  }

  async findAllForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: StockAdjustmentWithRefs[];
    count: number;
  }> {
    const totalQuantitySql = sql<string>`COALESCE((
      SELECT SUM(quantity) FROM vritti_core.stock_adjustment_lines WHERE stock_adjustment_id = ${stockAdjustments.id}
    ), 0)`;
    const isPublishableSql = sql<boolean>`(
      ${stockAdjustments.status} = 'DRAFT'
      AND EXISTS(SELECT 1 FROM vritti_core.stock_adjustment_lines WHERE stock_adjustment_id = ${stockAdjustments.id})
      AND NOT EXISTS(
        SELECT 1 FROM vritti_core.stock_adjustment_lines
        WHERE stock_adjustment_id = ${stockAdjustments.id} AND is_balanced = false
      )
    )`;
    return this.findAllAndCount<StockAdjustmentWithRefs>({
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
        metadata: stockAdjustments.metadata,
        createdAt: stockAdjustments.createdAt,
        inventoryItemName: inventoryItems.name,
        inventoryItemUomSymbol: uom.symbol,
        inventoryItemTracking: inventoryItems.tracking,
        totalQuantity: totalQuantitySql,
        isPublishable: isPublishableSql,
      },
      leftJoins: [
        { table: inventoryItems, on: eq(stockAdjustments.inventoryItemId, inventoryItems.id) },
        { table: uom, on: eq(inventoryItems.uomId, uom.id) },
      ],
      where: options.where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(stockAdjustments.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  async findByIdWithItemName(id: string): Promise<StockAdjustmentWithRefs | undefined> {
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
        metadata: stockAdjustments.metadata,
        createdAt: stockAdjustments.createdAt,
        inventoryItemName: inventoryItems.name,
        inventoryItemUomSymbol: uom.symbol,
        inventoryItemTracking: inventoryItems.tracking,
        totalQuantity: sql<string>`COALESCE(SUM(${stockAdjustmentLines.quantity}), 0)`,
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
        stockAdjustments.metadata,
        stockAdjustments.createdAt,
        inventoryItems.name,
        uom.symbol,
        inventoryItems.tracking,
      )
      .limit(1);

    const [row] = rows;
    if (!row) return undefined;
    return {
      ...row,
      totalQuantity: Number(row.totalQuantity ?? 0),
    } as StockAdjustmentWithRefs;
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
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextNumber = await this.nextSequenceValue();
    return `SA-${yearMonth}-${String(nextNumber).padStart(4, '0')}`;
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

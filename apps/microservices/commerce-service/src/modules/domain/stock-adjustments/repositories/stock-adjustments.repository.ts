import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  inventoryItems,
  type NewStockAdjustment,
  type StockAdjustment,
  type StockAdjustmentStatus,
  stockAdjustmentCodeSeq,
  stockAdjustmentLines,
  stockAdjustmentLots,
  stockAdjustments,
  uom,
} from '@/db/schema';

export type StockAdjustmentWithRefs = StockAdjustment & {
  inventoryItemName: string;
  inventoryItemUomId: string;
  inventoryItemUomSymbol: string | null;
  inventoryItemTracking: 'quantity' | 'lot' | 'serial' | 'lot_serial';
  totalQuantity: number;
  isPublishable?: boolean;
};

export type StockAdjustmentWithItem = StockAdjustment & {
  inventoryItemUomId: string;
  inventoryItemTracking: 'quantity' | 'lot' | 'serial' | 'lot_serial';
};

@Injectable()
export class StockAdjustmentsRepository extends PrimaryBaseRepository<typeof stockAdjustments> {
  constructor(database: PrimaryDatabaseService) {
    super(database, stockAdjustments, { sequence: stockAdjustmentCodeSeq });
  }

  async findByIdWithItem(id: string): Promise<StockAdjustmentWithItem | undefined> {
    const [row] = await this.db
      .select({
        id: stockAdjustments.id,
        organizationId: stockAdjustments.organizationId,
        businessUnitId: stockAdjustments.businessUnitId,
        inventoryItemId: stockAdjustments.inventoryItemId,
        code: stockAdjustments.code,
        type: stockAdjustments.type,
        status: stockAdjustments.status,
        reason: stockAdjustments.reason,
        publishedAt: stockAdjustments.publishedAt,
        createdAt: stockAdjustments.createdAt,
        inventoryItemUomId: inventoryItems.uomId,
        inventoryItemTracking: inventoryItems.tracking,
      })
      .from(stockAdjustments)
      .innerJoin(inventoryItems, eq(stockAdjustments.inventoryItemId, inventoryItems.id))
      .where(eq(stockAdjustments.id, id))
      .limit(1);
    return row as StockAdjustmentWithItem | undefined;
  }

  async findAllForTable(options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number }): Promise<{
    result: StockAdjustmentWithRefs[];
    count: number;
  }> {
    const totalQuantitySql = sql<string>`COALESCE((
      SELECT SUM(${stockAdjustmentLines.quantity} * ${stockAdjustmentLines.conversionFactor}) FROM ${stockAdjustmentLines} WHERE ${stockAdjustmentLines.stockAdjustmentId} = ${stockAdjustments.id}
    ), 0)`;
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
        publishedAt: stockAdjustments.publishedAt,
        createdAt: stockAdjustments.createdAt,
        inventoryItemName: inventoryItems.name,
        inventoryItemUomId: inventoryItems.uomId,
        inventoryItemUomSymbol: uom.symbol,
        inventoryItemTracking: inventoryItems.tracking,
        totalQuantity: totalQuantitySql,
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

  async findById(id: string): Promise<StockAdjustmentWithRefs | undefined> {
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
        publishedAt: stockAdjustments.publishedAt,
        createdAt: stockAdjustments.createdAt,
        inventoryItemName: inventoryItems.name,
        inventoryItemUomId: inventoryItems.uomId,
        inventoryItemUomSymbol: uom.symbol,
        inventoryItemTracking: inventoryItems.tracking,
        totalQuantity: sql<string>`COALESCE(SUM(${stockAdjustmentLines.quantity} * ${stockAdjustmentLines.conversionFactor}), 0)`,
        isPublishable: sql<boolean>`(
          ${stockAdjustments.status} = 'DRAFT'
          AND COUNT(DISTINCT ${stockAdjustmentLines.id}) > 0
          AND COUNT(DISTINCT ${stockAdjustmentLines.id}) =
              COUNT(DISTINCT CASE WHEN ${stockAdjustmentLines.isBalanced} THEN ${stockAdjustmentLines.id} END)
          AND NOT EXISTS(
            SELECT 1 FROM ${stockAdjustmentLots}
            WHERE ${stockAdjustmentLots.stockAdjustmentId} = ${stockAdjustments.id}
            AND NOT EXISTS(
              SELECT 1 FROM ${stockAdjustmentLines}
              WHERE ${stockAdjustmentLines.stockAdjustmentLotId} = ${stockAdjustmentLots.id}
            )
          )
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
        stockAdjustments.publishedAt,
        stockAdjustments.createdAt,
        inventoryItems.name,
        inventoryItems.uomId,
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

  async updateStatus(id: string, status: StockAdjustmentStatus, publishedAt?: Date): Promise<void> {
    await this.db
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

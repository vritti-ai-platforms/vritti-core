import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  type DisplayUnitRatios,
  displayUnitRatios,
  type InventoryTracking,
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
  inventoryItemUomSymbol: string;
  inventoryItemTracking: InventoryTracking;
  totalQuantity: number;
  isPublishable?: boolean;
  displayUnitRatios: DisplayUnitRatios;
};

export type StockAdjustmentCounts = {
  lineCount: number;
  lotCount: number;
};

export type StockAdjustmentWithItem = StockAdjustment & {
  inventoryItemName: string;
  inventoryItemUomId: string;
  inventoryItemTracking: InventoryTracking;
};

@Injectable()
export class StockAdjustmentsDomainRepository extends PrimaryBaseRepository<typeof stockAdjustments> {
  constructor(database: PrimaryDatabaseService) {
    super(database, stockAdjustments, { sequence: stockAdjustmentCodeSeq });
  }

  async findByIdWithItem(id: string): Promise<StockAdjustmentWithItem | undefined> {
    const [row] = await this.db
      .select({
        id: stockAdjustments.id,
        organizationId: stockAdjustments.organizationId,
        siteId: stockAdjustments.siteId,
        inventoryItemId: stockAdjustments.inventoryItemId,
        code: stockAdjustments.code,
        type: stockAdjustments.type,
        status: stockAdjustments.status,
        reason: stockAdjustments.reason,
        unitCost: stockAdjustments.unitCost,
        publishedAt: stockAdjustments.publishedAt,
        createdAt: stockAdjustments.createdAt,
        inventoryItemName: inventoryItems.name,
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
      SELECT SUM(${stockAdjustmentLines.primaryUomQty}) FROM ${stockAdjustmentLines} WHERE ${stockAdjustmentLines.stockAdjustmentId} = ${stockAdjustments.id}
    ), 0)`;
    return this.findAllAndCount<StockAdjustmentWithRefs>({
      select: {
        id: stockAdjustments.id,
        organizationId: stockAdjustments.organizationId,
        siteId: stockAdjustments.siteId,
        inventoryItemId: stockAdjustments.inventoryItemId,
        code: stockAdjustments.code,
        type: stockAdjustments.type,
        status: stockAdjustments.status,
        reason: stockAdjustments.reason,
        unitCost: stockAdjustments.unitCost,
        publishedAt: stockAdjustments.publishedAt,
        createdAt: stockAdjustments.createdAt,
        inventoryItemName: inventoryItems.name,
        inventoryItemUomId: inventoryItems.uomId,
        inventoryItemUomSymbol: uom.symbol,
        inventoryItemTracking: inventoryItems.tracking,
        totalQuantity: totalQuantitySql,
        displayUnitRatios: displayUnitRatios(),
      },
      innerJoins: [
        { table: inventoryItems, on: eq(stockAdjustments.inventoryItemId, inventoryItems.id) },
        { table: uom, on: eq(inventoryItems.uomId, uom.id) },
      ],
      where: options.where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(stockAdjustments.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // The totalQuantity aggregate arrives as a numeric string, so the row is mapped after the read rather than in the
  // query
  async findByIdWithRefs(id: string): Promise<StockAdjustmentWithRefs | undefined> {
    const row = await this.findById<Omit<StockAdjustmentWithRefs, 'totalQuantity'> & { totalQuantity: string }>(id, {
      select: {
        id: stockAdjustments.id,
        organizationId: stockAdjustments.organizationId,
        siteId: stockAdjustments.siteId,
        inventoryItemId: stockAdjustments.inventoryItemId,
        code: stockAdjustments.code,
        type: stockAdjustments.type,
        status: stockAdjustments.status,
        reason: stockAdjustments.reason,
        unitCost: stockAdjustments.unitCost,
        publishedAt: stockAdjustments.publishedAt,
        createdAt: stockAdjustments.createdAt,
        inventoryItemName: inventoryItems.name,
        inventoryItemUomId: inventoryItems.uomId,
        inventoryItemUomSymbol: uom.symbol,
        inventoryItemTracking: inventoryItems.tracking,
        totalQuantity: sql<string>`COALESCE(SUM(${stockAdjustmentLines.primaryUomQty}), 0)`,
        isPublishable: sql<boolean>`(
          ${stockAdjustments.status} = 'DRAFT'
          AND COUNT(DISTINCT ${stockAdjustmentLines.id}) > 0
          AND COUNT(DISTINCT ${stockAdjustmentLines.id}) =
              COUNT(DISTINCT CASE WHEN ${stockAdjustmentLines.isBalanced} THEN ${stockAdjustmentLines.id} END)
          AND (${stockAdjustments.type} <> 'OPENING_STOCK' OR ${stockAdjustments.unitCost} IS NOT NULL)
          AND NOT EXISTS(
            SELECT 1 FROM ${stockAdjustmentLots}
            WHERE ${stockAdjustmentLots.stockAdjustmentId} = ${stockAdjustments}.id
            AND NOT EXISTS(
              SELECT 1 FROM ${stockAdjustmentLines}
              WHERE ${stockAdjustmentLines.stockAdjustmentLotId} = ${stockAdjustmentLots.id}
            )
          )
        )`,
        displayUnitRatios: displayUnitRatios(),
      },
      innerJoins: [
        { table: inventoryItems, on: eq(stockAdjustments.inventoryItemId, inventoryItems.id) },
        { table: uom, on: eq(inventoryItems.uomId, uom.id) },
      ],
      leftJoin: { table: stockAdjustmentLines, on: eq(stockAdjustments.id, stockAdjustmentLines.stockAdjustmentId) },
      groupBy: [
        stockAdjustments.id,
        stockAdjustments.organizationId,
        stockAdjustments.siteId,
        stockAdjustments.inventoryItemId,
        stockAdjustments.code,
        stockAdjustments.type,
        stockAdjustments.status,
        stockAdjustments.reason,
        stockAdjustments.unitCost,
        stockAdjustments.publishedAt,
        stockAdjustments.createdAt,
        inventoryItems.id,
        inventoryItems.name,
        inventoryItems.uomId,
        uom.symbol,
        inventoryItems.tracking,
      ],
    });
    if (!row) return undefined;
    return { ...row, totalQuantity: Number(row.totalQuantity ?? 0) };
  }

  // Counts an adjustment's lines and draft lots, throwing when it is out of reach
  async findCountsOrThrow(id: string): Promise<StockAdjustmentCounts> {
    const counts = await this.findById<StockAdjustmentCounts>(id, { select: this.counts() });
    if (!counts) throw new NotFoundException('Stock adjustment not found.');
    return counts;
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

  // Counts the rows an adjustment's Breakdown tab lists: its lines, and the draft lots opening stock groups them under
  private counts() {
    return {
      lineCount: this.db.$count(stockAdjustmentLines, eq(stockAdjustmentLines.stockAdjustmentId, stockAdjustments.id)),
      lotCount: this.db.$count(stockAdjustmentLots, eq(stockAdjustmentLots.stockAdjustmentId, stockAdjustments.id)),
    };
  }
}

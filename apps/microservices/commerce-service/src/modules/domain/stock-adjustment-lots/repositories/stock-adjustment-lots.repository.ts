import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type DisplayUnitRatios,
  displayUnitRatios,
  inventoryItems,
  locations,
  type StockAdjustmentLot,
  stockAdjustmentLineItems,
  stockAdjustmentLines,
  stockAdjustmentLots,
  stockAdjustments,
} from '@/db/schema';
import type { StockAdjustmentTreeLotNode, StockAdjustmentTreeNode } from '../dto/entity/stock-adjustment-tree.dto';

export type StockAdjustmentLotWithStats = StockAdjustmentLot & {
  linesCount: number;
  totalQuantity: number;
  displayUnitRatios: DisplayUnitRatios;
};

export type StockAdjustmentLotDetailRow = StockAdjustmentLot & {
  linesCount: number;
  totalQuantity: number;
  displayUnitRatios: DisplayUnitRatios;
};

@Injectable()
export class StockAdjustmentLotsDomainRepository extends PrimaryBaseRepository<typeof stockAdjustmentLots> {
  constructor(database: PrimaryDatabaseService) {
    super(database, stockAdjustmentLots);
  }

  async findByAdjustmentId(adjustmentId: string): Promise<StockAdjustmentLotWithStats[]> {
    const rows = await this.db
      .select({
        id: stockAdjustmentLots.id,
        organizationId: stockAdjustmentLots.organizationId,
        siteId: stockAdjustmentLots.siteId,
        stockAdjustmentId: stockAdjustmentLots.stockAdjustmentId,
        lotNumber: stockAdjustmentLots.lotNumber,
        manufacturingDate: stockAdjustmentLots.manufacturingDate,
        expiryDate: stockAdjustmentLots.expiryDate,
        resolvedLotId: stockAdjustmentLots.resolvedLotId,
        createdAt: stockAdjustmentLots.createdAt,
        updatedAt: stockAdjustmentLots.updatedAt,
        linesCount: sql<number>`COALESCE(COUNT(DISTINCT ${stockAdjustmentLines.id}), 0)`,
        totalQuantity: sql<string>`COALESCE(SUM(${stockAdjustmentLines.primaryUomQty}), 0)`,
        displayUnitRatios: displayUnitRatios(),
      })
      .from(stockAdjustmentLots)
      .innerJoin(stockAdjustments, eq(stockAdjustments.id, stockAdjustmentLots.stockAdjustmentId))
      .innerJoin(inventoryItems, eq(inventoryItems.id, stockAdjustments.inventoryItemId))
      .leftJoin(stockAdjustmentLines, eq(stockAdjustmentLots.id, stockAdjustmentLines.stockAdjustmentLotId))
      .where(eq(stockAdjustmentLots.stockAdjustmentId, adjustmentId))
      .groupBy(stockAdjustmentLots.id, inventoryItems.id)
      .orderBy(asc(stockAdjustmentLots.createdAt));

    return rows.map((row) => ({
      ...row,
      linesCount: Number(row.linesCount),
      totalQuantity: Number(row.totalQuantity),
    })) as StockAdjustmentLotWithStats[];
  }

  // Returns the OPENING+serial tree as fully-formed lot nodes, each with its item's display-unit ratios, in one query.
  async findTreeNodesByAdjustmentId(adjustmentId: string): Promise<StockAdjustmentTreeLotNode[]> {
    const childrenJson = sql`COALESCE(
      json_agg(
        json_build_object(
          'id', ${stockAdjustmentLines.id},
          'name', COALESCE(${locations.name}, '—'),
          'path', json_build_array(${stockAdjustmentLots.id}, ${stockAdjustmentLines.id}),
          'kind', 'line',
          'uomQty', ${stockAdjustmentLines.uomQty},
          'lineItemsCount', (
            SELECT COUNT(*) FROM ${stockAdjustmentLineItems}
            WHERE ${stockAdjustmentLineItems.stockAdjustmentLineId} = ${stockAdjustmentLines.id}
          ),
          'isBalanced', ${stockAdjustmentLines.isBalanced}
        ) ORDER BY ${stockAdjustmentLines.createdAt}
      ) FILTER (WHERE ${stockAdjustmentLines.id} IS NOT NULL),
      '[]'::json
    )`;

    const node = sql<StockAdjustmentTreeNode>`json_build_object(
      'id', ${stockAdjustmentLots.id},
      'name', ${stockAdjustmentLots.lotNumber},
      'path', json_build_array(${stockAdjustmentLots.id}),
      'kind', 'lot',
      'totalQuantity', COALESCE(SUM(${stockAdjustmentLines.primaryUomQty}), 0),
      'linesCount', COALESCE(COUNT(DISTINCT ${stockAdjustmentLines.id}), 0),
      'isBalanced', COALESCE(SUM(CASE WHEN ${stockAdjustmentLines.isBalanced} = false THEN 1 ELSE 0 END), 0) = 0,
      'children', ${childrenJson}
    )`;

    const rows = await this.db
      .select({ node, displayUnitRatios: displayUnitRatios() })
      .from(stockAdjustmentLots)
      .innerJoin(stockAdjustments, eq(stockAdjustments.id, stockAdjustmentLots.stockAdjustmentId))
      .innerJoin(inventoryItems, eq(inventoryItems.id, stockAdjustments.inventoryItemId))
      .leftJoin(stockAdjustmentLines, eq(stockAdjustmentLots.id, stockAdjustmentLines.stockAdjustmentLotId))
      .leftJoin(locations, eq(stockAdjustmentLines.locationId, locations.id))
      .where(eq(stockAdjustmentLots.stockAdjustmentId, adjustmentId))
      .groupBy(stockAdjustmentLots.id, inventoryItems.id)
      .orderBy(asc(stockAdjustmentLots.createdAt));

    return rows.map((r) => ({ ...r.node, displayUnitRatios: r.displayUnitRatios }));
  }

  // Single lot's detail — stats for the selected lot header. Returns undefined if the lot doesn't exist.
  async findLotDetail(lotId: string): Promise<StockAdjustmentLotDetailRow | undefined> {
    const [row] = await this.db
      .select({
        id: stockAdjustmentLots.id,
        organizationId: stockAdjustmentLots.organizationId,
        siteId: stockAdjustmentLots.siteId,
        stockAdjustmentId: stockAdjustmentLots.stockAdjustmentId,
        lotNumber: stockAdjustmentLots.lotNumber,
        manufacturingDate: stockAdjustmentLots.manufacturingDate,
        expiryDate: stockAdjustmentLots.expiryDate,
        resolvedLotId: stockAdjustmentLots.resolvedLotId,
        createdAt: stockAdjustmentLots.createdAt,
        updatedAt: stockAdjustmentLots.updatedAt,
        linesCount: sql<number>`COALESCE(COUNT(DISTINCT ${stockAdjustmentLines.id}), 0)`,
        totalQuantity: sql<string>`COALESCE(SUM(${stockAdjustmentLines.primaryUomQty}), 0)`,
        displayUnitRatios: displayUnitRatios(),
      })
      .from(stockAdjustmentLots)
      .innerJoin(stockAdjustments, eq(stockAdjustments.id, stockAdjustmentLots.stockAdjustmentId))
      .innerJoin(inventoryItems, eq(inventoryItems.id, stockAdjustments.inventoryItemId))
      .leftJoin(stockAdjustmentLines, eq(stockAdjustmentLots.id, stockAdjustmentLines.stockAdjustmentLotId))
      .where(eq(stockAdjustmentLots.id, lotId))
      .groupBy(stockAdjustmentLots.id, inventoryItems.id)
      .limit(1);

    if (!row) return undefined;
    return {
      ...row,
      linesCount: Number(row.linesCount),
      totalQuantity: Number(row.totalQuantity),
    } as StockAdjustmentLotDetailRow;
  }

  async findByAdjustmentIdAndNumber(adjustmentId: string, lotNumber: string): Promise<StockAdjustmentLot | undefined> {
    const rows = await this.db
      .select()
      .from(stockAdjustmentLots)
      .where(and(eq(stockAdjustmentLots.stockAdjustmentId, adjustmentId), eq(stockAdjustmentLots.lotNumber, lotNumber)))
      .limit(1);
    return rows[0] as StockAdjustmentLot | undefined;
  }

  async createLot(data: typeof stockAdjustmentLots.$inferInsert): Promise<StockAdjustmentLot> {
    const results = await this.db.insert(stockAdjustmentLots).values(data).returning();
    return results[0] as StockAdjustmentLot;
  }

  async setResolvedLotId(lotId: string, resolvedLotId: string): Promise<void> {
    await this.db.update(stockAdjustmentLots).set({ resolvedLotId }).where(eq(stockAdjustmentLots.id, lotId));
  }

  // Counts how many line_items reference any line under this lot — used to validate deletion safety
  async countLineItemsForLot(lotId: string): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(stockAdjustmentLineItems)
      .innerJoin(stockAdjustmentLines, eq(stockAdjustmentLineItems.stockAdjustmentLineId, stockAdjustmentLines.id))
      .where(eq(stockAdjustmentLines.stockAdjustmentLotId, lotId));
    return Number(rows[0]?.count ?? 0);
  }
}

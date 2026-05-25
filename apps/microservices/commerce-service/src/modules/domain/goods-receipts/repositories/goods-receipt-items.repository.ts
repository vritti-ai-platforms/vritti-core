import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, asc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type GoodsReceiptItem,
  goodsReceiptItems,
  goodsReceiptLines,
  goodsReceiptLots,
  goodsReceipts,
  type InventoryTracking,
  inventoryItems,
  purchaseOrderItems,
  uom,
} from '@/db/schema';
import type { GoodsReceiptTreeNode } from '../dto/entity/goods-receipt-tree.dto';

export type GoodsReceiptItemWithRefs = GoodsReceiptItem & {
  inventoryItemName: string;
  inventoryItemTracking: InventoryTracking;
  inventoryItemUomSymbol: string;
  acceptedQuantity: number;
  lotsCount: number;
  linesCount: number;
  unbalancedLinesCount: number;
  poItemId: string | null;
  poOrderedQuantity: string | null;
  poReceivedQuantity: string | null;
};

@Injectable()
export class GoodsReceiptItemsRepository extends PrimaryBaseRepository<typeof goodsReceiptItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceiptItems);
  }

  async findByReceiptId(goodsReceiptId: string): Promise<GoodsReceiptItemWithRefs[]> {
    return this.runRichSelect(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId));
  }

  // Returns the unified GR tree (items → lots → lines) as fully-formed GoodsReceiptTreeNode[]
  // in a single query. SQL emits the wire shape directly via json_build_object/json_agg.
  // Children depth varies by tracking: quantity/serial → empty array, lot → lots only,
  // lot_serial → lots with line children.
  async findTreeNodesByReceiptId(goodsReceiptId: string): Promise<GoodsReceiptTreeNode[]> {
    // Per-item line aggregations (acceptedQuantity, unbalancedLinesCount).
    const acceptedQty = sql`(
      SELECT COALESCE(SUM(quantity), 0)
      FROM vritti_core.goods_receipt_lines
      WHERE goods_receipt_item_id = ${goodsReceiptItems.id}
    )`;
    const itemUnbalanced = sql`(
      SELECT COALESCE(SUM(CASE WHEN is_balanced = false THEN 1 ELSE 0 END), 0)
      FROM vritti_core.goods_receipt_lines
      WHERE goods_receipt_item_id = ${goodsReceiptItems.id}
    )`;

    // tracking='lot': lots as leaves (no `children` key).
    const lotsOnlyJson = sql`(
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'id', l.id,
            'name', l.lot_number,
            'path', json_build_array(${goodsReceiptItems.id}, l.id),
            'kind', 'lot',
            'totalQuantity', COALESCE(la.total_quantity, 0),
            'linesCount', COALESCE(la.lines_count, 0),
            'isBalanced', COALESCE(la.unbalanced_lines_count, 0) = 0
          ) ORDER BY l.created_at
        ),
        '[]'::json
      )
      FROM vritti_core.goods_receipt_lots l
      LEFT JOIN LATERAL (
        SELECT
          SUM(quantity) AS total_quantity,
          COUNT(*) AS lines_count,
          SUM(CASE WHEN is_balanced = false THEN 1 ELSE 0 END) AS unbalanced_lines_count
        FROM vritti_core.goods_receipt_lines
        WHERE goods_receipt_lot_id = l.id
      ) la ON TRUE
      WHERE l.goods_receipt_item_id = ${goodsReceiptItems.id}
    )`;

    // tracking='lot_serial': lots with line children.
    const lotsWithLinesJson = sql`(
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'id', l.id,
            'name', l.lot_number,
            'path', json_build_array(${goodsReceiptItems.id}, l.id),
            'kind', 'lot',
            'totalQuantity', COALESCE(la.total_quantity, 0),
            'linesCount', COALESCE(la.lines_count, 0),
            'isBalanced', COALESCE(la.unbalanced_lines_count, 0) = 0,
            'children', COALESCE(lc.lines_json, '[]'::json)
          ) ORDER BY l.created_at
        ),
        '[]'::json
      )
      FROM vritti_core.goods_receipt_lots l
      LEFT JOIN LATERAL (
        SELECT
          SUM(quantity) AS total_quantity,
          COUNT(*) AS lines_count,
          SUM(CASE WHEN is_balanced = false THEN 1 ELSE 0 END) AS unbalanced_lines_count
        FROM vritti_core.goods_receipt_lines
        WHERE goods_receipt_lot_id = l.id
      ) la ON TRUE
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', line.id,
            'name', COALESCE(loc.name, '—'),
            'path', json_build_array(${goodsReceiptItems.id}, l.id, line.id),
            'kind', 'line',
            'quantity', line.quantity,
            'lineItemsCount', (
              SELECT COUNT(*) FROM vritti_core.goods_receipt_line_items li
              WHERE li.goods_receipt_line_id = line.id
            ),
            'isBalanced', line.is_balanced
          ) ORDER BY line.created_at
        ) AS lines_json
        FROM vritti_core.goods_receipt_lines line
        LEFT JOIN vritti_core.locations loc ON line.location_id = loc.id
        WHERE line.goods_receipt_lot_id = l.id
      ) lc ON TRUE
      WHERE l.goods_receipt_item_id = ${goodsReceiptItems.id}
    )`;

    const node = sql<GoodsReceiptTreeNode>`json_build_object(
      'id', ${goodsReceiptItems.id},
      'name', COALESCE(${inventoryItems.name}, ${goodsReceiptItems.inventoryItemId}::text),
      'path', json_build_array(${goodsReceiptItems.id}),
      'kind', 'item',
      'inventoryItemId', ${goodsReceiptItems.inventoryItemId},
      'inventoryItemTracking', ${inventoryItems.tracking},
      'inventoryItemUomSymbol', ${uom.symbol},
      'acceptedQuantity', ${acceptedQty},
      'rejectedQuantity', ${goodsReceiptItems.rejectedQuantity},
      'poOrderedQuantity', ${purchaseOrderItems.uomQty},
      'poReceivedQuantity', ${purchaseOrderItems.receivedQuantity},
      'poRemainingQuantity', CASE
        WHEN ${purchaseOrderItems.uomQty} IS NOT NULL
        THEN ${purchaseOrderItems.uomQty} - COALESCE(${purchaseOrderItems.receivedQuantity}, 0)
        ELSE NULL
      END,
      'isBalanced', ${itemUnbalanced} = 0,
      'children', CASE ${inventoryItems.tracking}
        WHEN 'lot' THEN ${lotsOnlyJson}
        WHEN 'lot_serial' THEN ${lotsWithLinesJson}
        ELSE '[]'::json
      END
    )`;

    const rows = await this.db
      .select({ node })
      .from(goodsReceiptItems)
      .leftJoin(inventoryItems, eq(goodsReceiptItems.inventoryItemId, inventoryItems.id))
      .leftJoin(uom, eq(inventoryItems.uomId, uom.id))
      .leftJoin(goodsReceipts, eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id))
      .leftJoin(
        purchaseOrderItems,
        and(
          eq(purchaseOrderItems.purchaseOrderId, goodsReceipts.purchaseOrderId),
          eq(purchaseOrderItems.inventoryItemId, goodsReceiptItems.inventoryItemId),
        ),
      )
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId))
      .orderBy(asc(goodsReceiptItems.createdAt));

    return rows.map((r) => r.node);
  }

  async findByReceiptIdAndItemId(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItem | null> {
    const [row] = await this.db
      .select()
      .from(goodsReceiptItems)
      .where(and(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId), eq(goodsReceiptItems.id, itemId)));
    return row ?? null;
  }

  async findByReceiptIdAndItemIdWithRefs(
    goodsReceiptId: string,
    itemId: string,
  ): Promise<GoodsReceiptItemWithRefs | undefined> {
    const result = await this.runRichSelect(
      and(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId), eq(goodsReceiptItems.id, itemId)),
    );
    return result[0];
  }

  async getTrackingForItem(itemId: string): Promise<InventoryTracking | null> {
    const rows = await this.db
      .select({ tracking: inventoryItems.tracking })
      .from(goodsReceiptItems)
      .innerJoin(inventoryItems, eq(goodsReceiptItems.inventoryItemId, inventoryItems.id))
      .where(eq(goodsReceiptItems.id, itemId))
      .limit(1);
    return rows[0]?.tracking ?? null;
  }

  async countByReceiptId(goodsReceiptId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(goodsReceiptItems)
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId));
    return Number(row?.count ?? 0);
  }

  async findInventoryItemIds(goodsReceiptId: string): Promise<string[]> {
    const rows = await this.db
      .select({ inventoryItemId: goodsReceiptItems.inventoryItemId })
      .from(goodsReceiptItems)
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId));
    return rows.map((row) => row.inventoryItemId);
  }

  async findForTable(
    goodsReceiptId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: GoodsReceiptItemWithRefs[]; count: number }> {
    const baseWhere = eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId);
    const where = options.where ? and(baseWhere, options.where) : baseWhere;
    const acceptedQtySql = sql<number>`COALESCE((
      SELECT SUM(${goodsReceiptLines.quantity})
      FROM ${goodsReceiptLines}
      WHERE ${goodsReceiptLines.goodsReceiptItemId} = ${goodsReceiptItems.id}
    ), 0)`.mapWith(Number);
    const lotsCountSql = sql<number>`(
      SELECT COUNT(*) FROM ${goodsReceiptLots}
      WHERE ${goodsReceiptLots.goodsReceiptItemId} = ${goodsReceiptItems.id}
    )`.mapWith(Number);
    const linesCountSql = sql<number>`(
      SELECT COUNT(*) FROM ${goodsReceiptLines}
      WHERE ${goodsReceiptLines.goodsReceiptItemId} = ${goodsReceiptItems.id}
    )`.mapWith(Number);
    const unbalancedLinesCountSql = sql<number>`(
      SELECT COUNT(*) FROM ${goodsReceiptLines}
      WHERE ${goodsReceiptLines.goodsReceiptItemId} = ${goodsReceiptItems.id} AND ${goodsReceiptLines.isBalanced} = false
    )`.mapWith(Number);
    const { result, count } = await this.findAllAndCount<GoodsReceiptItemWithRefs>({
      select: {
        id: goodsReceiptItems.id,
        organizationId: goodsReceiptItems.organizationId,
        businessUnitId: goodsReceiptItems.businessUnitId,
        goodsReceiptId: goodsReceiptItems.goodsReceiptId,
        inventoryItemId: goodsReceiptItems.inventoryItemId,
        rejectedQuantity: goodsReceiptItems.rejectedQuantity,
        metadata: goodsReceiptItems.metadata,
        createdAt: goodsReceiptItems.createdAt,
        updatedAt: goodsReceiptItems.updatedAt,
        inventoryItemName: inventoryItems.name,
        inventoryItemTracking: inventoryItems.tracking,
        inventoryItemUomSymbol: uom.symbol,
        poItemId: purchaseOrderItems.id,
        poOrderedQuantity: purchaseOrderItems.uomQty,
        poReceivedQuantity: purchaseOrderItems.receivedQuantity,
        acceptedQuantity: acceptedQtySql,
        lotsCount: lotsCountSql,
        linesCount: linesCountSql,
        unbalancedLinesCount: unbalancedLinesCountSql,
      },
      leftJoins: [
        { table: inventoryItems, on: eq(goodsReceiptItems.inventoryItemId, inventoryItems.id) },
        { table: uom, on: eq(inventoryItems.uomId, uom.id) },
        { table: goodsReceipts, on: eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id) },
        {
          table: purchaseOrderItems,
          on: and(
            eq(purchaseOrderItems.purchaseOrderId, goodsReceipts.purchaseOrderId),
            eq(purchaseOrderItems.inventoryItemId, goodsReceiptItems.inventoryItemId),
          ),
        },
      ],
      where,
      orderBy: options.orderBy?.length ? options.orderBy : [asc(goodsReceiptItems.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
    return { result, count };
  }

  // For a given (receiptId, inventoryItemId), check if a row already exists (for unique enforcement at write time)
  async findByReceiptAndInventoryItem(
    goodsReceiptId: string,
    inventoryItemId: string,
  ): Promise<GoodsReceiptItem | undefined> {
    const rows = await this.db
      .select()
      .from(goodsReceiptItems)
      .where(
        and(
          eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId),
          eq(goodsReceiptItems.inventoryItemId, inventoryItemId),
        ),
      )
      .limit(1);
    return rows[0] as GoodsReceiptItem | undefined;
  }

  // Used by the publish flow — minimal projection: itemId, inventoryItemId, tracking, rejectedQuantity, poItemId
  async findByReceiptIdForPublish(goodsReceiptId: string): Promise<
    {
      id: string;
      inventoryItemId: string;
      rejectedQuantity: string;
      tracking: InventoryTracking;
      poItemId: string | null;
      poOrderedQuantity: string | null;
      poReceivedQuantity: string | null;
    }[]
  > {
    const rows = await this.db
      .select({
        id: goodsReceiptItems.id,
        inventoryItemId: goodsReceiptItems.inventoryItemId,
        rejectedQuantity: goodsReceiptItems.rejectedQuantity,
        tracking: inventoryItems.tracking,
        poItemId: purchaseOrderItems.id,
        poOrderedQuantity: purchaseOrderItems.uomQty,
        poReceivedQuantity: purchaseOrderItems.receivedQuantity,
      })
      .from(goodsReceiptItems)
      .innerJoin(inventoryItems, eq(goodsReceiptItems.inventoryItemId, inventoryItems.id))
      .innerJoin(goodsReceipts, eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id))
      .leftJoin(
        purchaseOrderItems,
        and(
          eq(purchaseOrderItems.purchaseOrderId, goodsReceipts.purchaseOrderId),
          eq(purchaseOrderItems.inventoryItemId, goodsReceiptItems.inventoryItemId),
        ),
      )
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId))
      .orderBy(asc(goodsReceiptItems.createdAt));
    return rows;
  }

  private async runRichSelect(
    where: SQL | undefined,
    orderBy?: SQL[],
    limit?: number,
    offset?: number,
  ): Promise<GoodsReceiptItemWithRefs[]> {
    const acceptedQtySql = sql<number>`COALESCE((
      SELECT SUM(${goodsReceiptLines.quantity})
      FROM ${goodsReceiptLines}
      WHERE ${goodsReceiptLines.goodsReceiptItemId} = ${goodsReceiptItems.id}
    ), 0)`.mapWith(Number);
    const lotsCountSql = sql<number>`(
      SELECT COUNT(*) FROM ${goodsReceiptLots}
      WHERE ${goodsReceiptLots.goodsReceiptItemId} = ${goodsReceiptItems.id}
    )`.mapWith(Number);
    const linesCountSql = sql<number>`(
      SELECT COUNT(*) FROM ${goodsReceiptLines}
      WHERE ${goodsReceiptLines.goodsReceiptItemId} = ${goodsReceiptItems.id}
    )`.mapWith(Number);
    const unbalancedLinesCountSql = sql<number>`(
      SELECT COUNT(*) FROM ${goodsReceiptLines}
      WHERE ${goodsReceiptLines.goodsReceiptItemId} = ${goodsReceiptItems.id} AND ${goodsReceiptLines.isBalanced} = false
    )`.mapWith(Number);

    const query = this.db
      .select({
        id: goodsReceiptItems.id,
        organizationId: goodsReceiptItems.organizationId,
        businessUnitId: goodsReceiptItems.businessUnitId,
        goodsReceiptId: goodsReceiptItems.goodsReceiptId,
        inventoryItemId: goodsReceiptItems.inventoryItemId,
        rejectedQuantity: goodsReceiptItems.rejectedQuantity,
        metadata: goodsReceiptItems.metadata,
        createdAt: goodsReceiptItems.createdAt,
        updatedAt: goodsReceiptItems.updatedAt,
        inventoryItemName: inventoryItems.name,
        inventoryItemTracking: inventoryItems.tracking,
        inventoryItemUomSymbol: uom.symbol,
        poItemId: purchaseOrderItems.id,
        poOrderedQuantity: purchaseOrderItems.uomQty,
        poReceivedQuantity: purchaseOrderItems.receivedQuantity,
        acceptedQuantity: acceptedQtySql,
        lotsCount: lotsCountSql,
        linesCount: linesCountSql,
        unbalancedLinesCount: unbalancedLinesCountSql,
      })
      .from(goodsReceiptItems)
      .leftJoin(inventoryItems, eq(goodsReceiptItems.inventoryItemId, inventoryItems.id))
      .leftJoin(uom, eq(inventoryItems.uomId, uom.id))
      .leftJoin(goodsReceipts, eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id))
      .leftJoin(
        purchaseOrderItems,
        and(
          eq(purchaseOrderItems.purchaseOrderId, goodsReceipts.purchaseOrderId),
          eq(purchaseOrderItems.inventoryItemId, goodsReceiptItems.inventoryItemId),
        ),
      )
      .where(where ?? sql`TRUE`)
      .orderBy(...(orderBy?.length ? orderBy : [asc(goodsReceiptItems.createdAt)]));

    const finalQuery = limit !== undefined ? query.limit(limit).offset(offset ?? 0) : query;
    const rows = await finalQuery;

    return rows as GoodsReceiptItemWithRefs[];
  }
}

// Suppress unused warning — `goodsReceiptLines` and `goodsReceiptLots` are kept for type-safe references in future overhauls
void goodsReceiptLines;
void goodsReceiptLots;

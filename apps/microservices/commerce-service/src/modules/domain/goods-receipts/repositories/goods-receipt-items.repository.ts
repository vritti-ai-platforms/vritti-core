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
  purchaseOrders,
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

    // tracking='serial': lines as direct children of the item (no lot layer). Each line carries
    // serial count via lineItemsCount so the tree-side balance indicator stays consistent with the
    // lot_serial pattern.
    const linesOnlyJson = sql`(
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'id', line.id,
            'name', COALESCE(loc.name, '—'),
            'path', json_build_array(${goodsReceiptItems.id}, line.id),
            'kind', 'line',
            'quantity', line.quantity,
            'lineItemsCount', (
              SELECT COUNT(*) FROM vritti_core.goods_receipt_line_items li
              WHERE li.goods_receipt_line_id = line.id
            ),
            'isBalanced', line.is_balanced
          ) ORDER BY line.created_at
        ),
        '[]'::json
      )
      FROM vritti_core.goods_receipt_lines line
      LEFT JOIN vritti_core.locations loc ON line.location_id = loc.id
      WHERE line.goods_receipt_item_id = ${goodsReceiptItems.id}
    )`;

    const node = sql<GoodsReceiptTreeNode>`json_build_object(
      'id', ${goodsReceiptItems.id},
      'name', COALESCE(${inventoryItems.name}, ${goodsReceiptItems.inventoryItemId}::text),
      'path', json_build_array(${goodsReceiptItems.id}),
      'kind', 'item',
      'inventoryItemId', ${goodsReceiptItems.inventoryItemId},
      'inventoryItemTracking', ${inventoryItems.tracking},
      'inventoryItemUomSymbol', ${uom.symbol},
      'inventoryItemAllowDecimal', ${uom.allowDecimal},
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
        WHEN 'serial' THEN ${linesOnlyJson}
        ELSE '[]'::json
      END
    )`;

    const rows = await this.db
      .select({ node })
      .from(goodsReceiptItems)
      .leftJoin(inventoryItems, eq(goodsReceiptItems.inventoryItemId, inventoryItems.id))
      // UOM resolves from the GR item's snapshot, not the inventory item's primary UOM, so the
      // displayed symbol matches what the receiver picked (e.g. "box" not the item's primary "pc").
      .leftJoin(uom, eq(goodsReceiptItems.uomId, uom.id))
      .leftJoin(goodsReceipts, eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id))
      // PO join matches on the full (po_id, inventory_item_id, uom_id) triple to avoid multiplying
      // rows when the PO has the same product in multiple UOMs.
      .leftJoin(
        purchaseOrderItems,
        and(
          eq(purchaseOrderItems.purchaseOrderId, goodsReceipts.purchaseOrderId),
          eq(purchaseOrderItems.inventoryItemId, goodsReceiptItems.inventoryItemId),
          eq(purchaseOrderItems.uomId, goodsReceiptItems.uomId),
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
        { table: uom, on: eq(goodsReceiptItems.uomId, uom.id) },
        { table: goodsReceipts, on: eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id) },
        {
          table: purchaseOrderItems,
          on: and(
            eq(purchaseOrderItems.purchaseOrderId, goodsReceipts.purchaseOrderId),
            eq(purchaseOrderItems.inventoryItemId, goodsReceiptItems.inventoryItemId),
            eq(purchaseOrderItems.uomId, goodsReceiptItems.uomId),
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

  // For a given (receiptId, inventoryItemId, uomId), check if a row already exists. Matches the
  // unique constraint (gr_id, inventory_item_id, uom_id) — used by the duplicate check on add.
  async findByReceiptInventoryItemAndUom(
    goodsReceiptId: string,
    inventoryItemId: string,
    uomId: string,
  ): Promise<GoodsReceiptItem | undefined> {
    const rows = await this.db
      .select()
      .from(goodsReceiptItems)
      .where(
        and(
          eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId),
          eq(goodsReceiptItems.inventoryItemId, inventoryItemId),
          eq(goodsReceiptItems.uomId, uomId),
        ),
      )
      .limit(1);
    return rows[0] as GoodsReceiptItem | undefined;
  }

  // Used by autoAssociateSupplierPrice (PR5b). Returns each GR-item that has a captured
  // `primary_uom_unit_price > 0`, along with the data needed to build a SUPPLIER_PRICE cost row:
  //   - grItemId             — per-item allocation scope (the GR-item's quants)
  //   - inventoryItemCode    — populated into the cost row's `notes`
  //   - uomSymbol            — populated into the cost row's `notes`
  //   - primaryUomUnitPrice  — captured at the breakdown step; minor-units bigint
  //   - currencyCode         — currency on the gr_item
  //   - vendorRef            — po.poNumber when linked, else null
  // Works for both PO-linked and un-linked GRs. PR5b shifted the source from `po_items` to
  // `goods_receipt_items` so un-linked GRs participate too.
  async findGrItemsForAutoCost(goodsReceiptId: string): Promise<
    {
      grItemId: string;
      inventoryItemCode: string;
      uomSymbol: string;
      primaryUomUnitPrice: bigint;
      currencyCode: string;
      vendorRef: string | null;
    }[]
  > {
    const rows = await this.db
      .select({
        grItemId: goodsReceiptItems.id,
        inventoryItemCode: inventoryItems.code,
        uomSymbol: uom.symbol,
        primaryUomUnitPrice: goodsReceiptItems.primaryUomUnitPrice,
        currencyCode: goodsReceiptItems.currencyCode,
        vendorRef: purchaseOrders.poNumber,
      })
      .from(goodsReceiptItems)
      .innerJoin(inventoryItems, eq(goodsReceiptItems.inventoryItemId, inventoryItems.id))
      .innerJoin(uom, eq(goodsReceiptItems.uomId, uom.id))
      .innerJoin(goodsReceipts, eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id))
      .leftJoin(purchaseOrders, eq(goodsReceipts.purchaseOrderId, purchaseOrders.id))
      .where(
        and(
          eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId),
          sql`${goodsReceiptItems.primaryUomUnitPrice} IS NOT NULL`,
          sql`${goodsReceiptItems.primaryUomUnitPrice} > 0`,
          sql`${goodsReceiptItems.currencyCode} IS NOT NULL`,
        ),
      )
      .orderBy(asc(goodsReceiptItems.createdAt));

    return rows.map((r) => ({
      grItemId: r.grItemId,
      inventoryItemCode: r.inventoryItemCode,
      uomSymbol: r.uomSymbol,
      primaryUomUnitPrice: BigInt(r.primaryUomUnitPrice as unknown as string),
      currencyCode: r.currencyCode as string,
      vendorRef: r.vendorRef ?? null,
    }));
  }

  // Used by the publish flow — minimal projection: itemId, inventoryItemId, uomId, tracking,
  // rejectedQuantity, poItemId
  async findByReceiptIdForPublish(goodsReceiptId: string): Promise<
    {
      id: string;
      inventoryItemId: string;
      uomId: string;
      rejectedQuantity: number;
      tracking: InventoryTracking;
      poItemId: string | null;
      poOrderedQuantity: number | null;
      poReceivedQuantity: number | null;
    }[]
  > {
    const rows = await this.db
      .select({
        id: goodsReceiptItems.id,
        inventoryItemId: goodsReceiptItems.inventoryItemId,
        uomId: goodsReceiptItems.uomId,
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
          // Match the UOM too — without this, a PO that has the same item in multiple UOMs
          // duplicates each GR-item row, which makes the publish loop run twice on the same line
          // and double-insert serials. Matches the join in runRichSelect / the tree query.
          eq(purchaseOrderItems.uomId, goodsReceiptItems.uomId),
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
        unitPrice: goodsReceiptItems.unitPrice,
        primaryUomUnitPrice: goodsReceiptItems.primaryUomUnitPrice,
        currencyCode: goodsReceiptItems.currencyCode,
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
      .leftJoin(uom, eq(goodsReceiptItems.uomId, uom.id))
      .leftJoin(goodsReceipts, eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id))
      .leftJoin(
        purchaseOrderItems,
        and(
          eq(purchaseOrderItems.purchaseOrderId, goodsReceipts.purchaseOrderId),
          eq(purchaseOrderItems.inventoryItemId, goodsReceiptItems.inventoryItemId),
          eq(purchaseOrderItems.uomId, goodsReceiptItems.uomId),
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

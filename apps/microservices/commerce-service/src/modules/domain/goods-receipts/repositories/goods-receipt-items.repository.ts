import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, desc, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type GoodsReceiptItem, goodsReceiptItems, goodsReceipts, inventoryItems, purchaseOrderItems } from '@/db/schema';

@Injectable()
export class GoodsReceiptItemsRepository extends PrimaryBaseRepository<typeof goodsReceiptItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceiptItems);
  }

  // Find all items for a receipt, joined with inventory item name and PO quantities
  async findByReceiptId(
    goodsReceiptId: string,
  ): Promise<(GoodsReceiptItem & { inventoryItemName: string | null; poOrderedQuantity: string | null; poReceivedQuantity: string | null })[]> {
    const rows = await this.db
      .select({
        id: goodsReceiptItems.id,
        organizationId: goodsReceiptItems.organizationId,
        businessUnitId: goodsReceiptItems.businessUnitId,
        goodsReceiptId: goodsReceiptItems.goodsReceiptId,
        inventoryItemId: goodsReceiptItems.inventoryItemId,
        acceptedQuantity: goodsReceiptItems.acceptedQuantity,
        rejectedQuantity: goodsReceiptItems.rejectedQuantity,
        createdAt: goodsReceiptItems.createdAt,
        updatedAt: goodsReceiptItems.updatedAt,
        inventoryItemName: sql<string | null>`COALESCE(
          ${inventoryItems.name},
          ${goodsReceiptItems.inventoryItemId}::text
        )`,
        poOrderedQuantity: purchaseOrderItems.orderedQuantity,
        poReceivedQuantity: purchaseOrderItems.receivedQuantity,
      })
      .from(goodsReceiptItems)
      .leftJoin(inventoryItems, eq(goodsReceiptItems.inventoryItemId, inventoryItems.id))
      .leftJoin(goodsReceipts, eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id))
      .leftJoin(
        purchaseOrderItems,
        and(
          eq(purchaseOrderItems.purchaseOrderId, goodsReceipts.purchaseOrderId),
          eq(purchaseOrderItems.inventoryItemId, goodsReceiptItems.inventoryItemId),
        ),
      )
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId))
      .orderBy(desc(goodsReceiptItems.createdAt));

    return rows as (GoodsReceiptItem & { inventoryItemName: string | null; poOrderedQuantity: string | null; poReceivedQuantity: string | null })[];
  }

  // Find a single item by its own ID
  async findItemById(itemId: string): Promise<GoodsReceiptItem | null> {
    const [row] = await this.db.select().from(goodsReceiptItems).where(eq(goodsReceiptItems.id, itemId));
    return row ?? null;
  }

  // Find an item by receipt ID and item ID
  async findByReceiptIdAndItemId(goodsReceiptId: string, itemId: string): Promise<GoodsReceiptItem | null> {
    const [row] = await this.db
      .select()
      .from(goodsReceiptItems)
      .where(and(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId), eq(goodsReceiptItems.id, itemId)));
    return row ?? null;
  }

  // Count items for a given receipt
  async countByReceiptId(goodsReceiptId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(goodsReceiptItems)
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId));
    return Number(row?.count ?? 0);
  }

  // Find all inventory item IDs for a given receipt
  async findInventoryItemIds(goodsReceiptId: string): Promise<string[]> {
    const rows = await this.db
      .select({ inventoryItemId: goodsReceiptItems.inventoryItemId })
      .from(goodsReceiptItems)
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId));
    return rows.map((row) => row.inventoryItemId);
  }

  // Find items with pagination for table view
  async findForTable(
    goodsReceiptId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: (GoodsReceiptItem & { inventoryItemName: string | null; poOrderedQuantity: string | null; poReceivedQuantity: string | null })[]; count: number }> {
    const baseWhere = eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId);
    const where = options.where ? and(baseWhere, options.where) : baseWhere;
    const countQuery = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(goodsReceiptItems)
      .leftJoin(inventoryItems, eq(goodsReceiptItems.inventoryItemId, inventoryItems.id))
      .where(where);

    const resultQuery = this.db
      .select({
        id: goodsReceiptItems.id,
        organizationId: goodsReceiptItems.organizationId,
        businessUnitId: goodsReceiptItems.businessUnitId,
        goodsReceiptId: goodsReceiptItems.goodsReceiptId,
        inventoryItemId: goodsReceiptItems.inventoryItemId,
        acceptedQuantity: goodsReceiptItems.acceptedQuantity,
        rejectedQuantity: goodsReceiptItems.rejectedQuantity,
        createdAt: goodsReceiptItems.createdAt,
        updatedAt: goodsReceiptItems.updatedAt,
        inventoryItemName: inventoryItems.name,
        poOrderedQuantity: purchaseOrderItems.orderedQuantity,
        poReceivedQuantity: purchaseOrderItems.receivedQuantity,
      })
      .from(goodsReceiptItems)
      .leftJoin(inventoryItems, eq(goodsReceiptItems.inventoryItemId, inventoryItems.id))
      .leftJoin(goodsReceipts, eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id))
      .leftJoin(
        purchaseOrderItems,
        and(
          eq(purchaseOrderItems.purchaseOrderId, goodsReceipts.purchaseOrderId),
          eq(purchaseOrderItems.inventoryItemId, goodsReceiptItems.inventoryItemId),
        ),
      )
      .where(where)
      .orderBy(...(options.orderBy?.length ? options.orderBy : [desc(goodsReceiptItems.createdAt)]))
      .limit(options.limit)
      .offset(options.offset);

    const [countRows, resultRows] = await Promise.all([countQuery, resultQuery]);
    return {
      result: resultRows as (GoodsReceiptItem & { inventoryItemName: string | null; poOrderedQuantity: string | null; poReceivedQuantity: string | null })[],
      count: Number(countRows[0]?.count ?? 0),
    };
  }

  // Find items for publish validation
  async findByReceiptIdForPublish(
    goodsReceiptId: string,
  ): Promise<GoodsReceiptItem[]> {
    const rows = await this.db
      .select({
        id: goodsReceiptItems.id,
        organizationId: goodsReceiptItems.organizationId,
        businessUnitId: goodsReceiptItems.businessUnitId,
        goodsReceiptId: goodsReceiptItems.goodsReceiptId,
        inventoryItemId: goodsReceiptItems.inventoryItemId,
        acceptedQuantity: goodsReceiptItems.acceptedQuantity,
        rejectedQuantity: goodsReceiptItems.rejectedQuantity,
        createdAt: goodsReceiptItems.createdAt,
        updatedAt: goodsReceiptItems.updatedAt,
      })
      .from(goodsReceiptItems)
      .where(eq(goodsReceiptItems.goodsReceiptId, goodsReceiptId))
      .orderBy(desc(goodsReceiptItems.createdAt));

    return rows as GoodsReceiptItem[];
  }
}

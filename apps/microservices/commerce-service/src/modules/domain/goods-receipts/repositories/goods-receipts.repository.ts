import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type GoodsReceiptItem,
  type NewGoodsReceiptItem,
  goodsReceiptItems,
  goodsReceipts,
  inventoryItems,
  purchaseOrderItems,
} from '@/db/schema';

@Injectable()
export class GoodsReceiptsRepository extends PrimaryBaseRepository<typeof goodsReceipts> {
  constructor(database: PrimaryDatabaseService) {
    super(database, goodsReceipts);
  }

  // Returns GR items for a goods receipt with inventory item names
  async findItemsByGrId(grId: string): Promise<(GoodsReceiptItem & { inventoryItemName: string | null })[]> {
    const rows = await this.db
      .select({
        id: goodsReceiptItems.id,
        organizationId: goodsReceiptItems.organizationId,
        goodsReceiptId: goodsReceiptItems.goodsReceiptId,
        purchaseOrderItemId: goodsReceiptItems.purchaseOrderItemId,
        acceptedQuantity: goodsReceiptItems.acceptedQuantity,
        rejectedQuantity: goodsReceiptItems.rejectedQuantity,
        rejectionReason: goodsReceiptItems.rejectionReason,
        inventoryItemName: inventoryItems.name,
      })
      .from(goodsReceiptItems)
      .leftJoin(purchaseOrderItems, eq(goodsReceiptItems.purchaseOrderItemId, purchaseOrderItems.id))
      .leftJoin(inventoryItems, eq(purchaseOrderItems.inventoryItemId, inventoryItems.id))
      .where(eq(goodsReceiptItems.goodsReceiptId, grId));

    return rows as (GoodsReceiptItem & { inventoryItemName: string | null })[];
  }

  // Returns all GRs for a PO
  async findByPoId(poId: string) {
    return this.db.select().from(goodsReceipts).where(eq(goodsReceipts.purchaseOrderId, poId));
  }

  // Creates GR line items
  async createItems(items: NewGoodsReceiptItem[]): Promise<GoodsReceiptItem[]> {
    if (items.length === 0) return [];
    return this.db.insert(goodsReceiptItems).values(items).returning() as Promise<GoodsReceiptItem[]>;
  }

  // Updates PO item received quantity
  async updatePoItemReceivedQty(poItemId: string, addQty: number): Promise<void> {
    await this.db
      .update(purchaseOrderItems)
      .set({
        receivedQuantity: sql`${purchaseOrderItems.receivedQuantity} + ${String(addQty)}`,
      })
      .where(eq(purchaseOrderItems.id, poItemId));
  }

  // Returns inventory item ID from a PO item
  async findInventoryItemIdFromPoItem(poItemId: string): Promise<string | null> {
    const result = await this.db
      .select({ inventoryItemId: purchaseOrderItems.inventoryItemId })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.id, poItemId));
    return result[0]?.inventoryItemId ?? null;
  }
}

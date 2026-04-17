import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService, type TypedDrizzleClient } from '@vritti/api-sdk';
import { eq, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  inventoryItems,
  type NewPurchaseOrderItem,
  type PurchaseOrderItem,
  purchaseOrderItems,
  purchaseOrderNumberSeq,
  purchaseOrders,
  suppliers,
} from '@/db/schema';

@Injectable()
export class PurchaseOrdersRepository extends PrimaryBaseRepository<typeof purchaseOrders> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseOrders, { sequence: purchaseOrderNumberSeq });
  }

  // Returns supplier name for a given supplier ID
  async findSupplierName(supplierId: string): Promise<string | null> {
    const result = await this.db.select({ name: suppliers.name }).from(suppliers).where(eq(suppliers.id, supplierId));
    return result[0]?.name ?? null;
  }

  // Returns all line items for a PO with inventory item names
  async findItemsByPoId(poId: string): Promise<(PurchaseOrderItem & { inventoryItemName: string | null })[]> {
    const rows = await this.db
      .select({
        id: purchaseOrderItems.id,
        organizationId: purchaseOrderItems.organizationId,
        purchaseOrderId: purchaseOrderItems.purchaseOrderId,
        inventoryItemId: purchaseOrderItems.inventoryItemId,
        orderedQuantity: purchaseOrderItems.orderedQuantity,
        receivedQuantity: purchaseOrderItems.receivedQuantity,
        unitPrice: purchaseOrderItems.unitPrice,
        totalPrice: purchaseOrderItems.totalPrice,
        inventoryItemName: inventoryItems.name,
      })
      .from(purchaseOrderItems)
      .leftJoin(inventoryItems, eq(purchaseOrderItems.inventoryItemId, inventoryItems.id))
      .where(eq(purchaseOrderItems.purchaseOrderId, poId));

    return rows as (PurchaseOrderItem & { inventoryItemName: string | null })[];
  }

  // Creates PO line items
  async createItems(items: NewPurchaseOrderItem[]): Promise<PurchaseOrderItem[]> {
    if (items.length === 0) return [];
    return this.db.insert(purchaseOrderItems).values(items).returning() as Promise<PurchaseOrderItem[]>;
  }

  // Creates PO line items within an existing transaction
  async createItemsWithTx(tx: TypedDrizzleClient, items: NewPurchaseOrderItem[]): Promise<PurchaseOrderItem[]> {
    if (items.length === 0) return [];
    return tx.insert(purchaseOrderItems).values(items).returning() as Promise<PurchaseOrderItem[]>;
  }

  // Deletes all line items for a PO
  async deleteItemsByPoId(poId: string): Promise<void> {
    await this.db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, poId));
  }

  // Deletes all line items for a PO within an existing transaction
  async deleteItemsByPoIdWithTx(tx: TypedDrizzleClient, poId: string): Promise<void> {
    await tx.delete(purchaseOrderItems).where(eq(purchaseOrderItems.purchaseOrderId, poId));
  }

  // Updates received quantity on a PO line item
  async updateItemReceivedQuantity(itemId: string, addQuantity: number): Promise<void> {
    await this.db
      .update(purchaseOrderItems)
      .set({
        receivedQuantity: sql`${purchaseOrderItems.receivedQuantity} + ${String(addQuantity)}`,
      })
      .where(eq(purchaseOrderItems.id, itemId));
  }

  // Generates a sequential PO number
  async generatePoNumber(): Promise<string> {
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextNumber = await this.nextSequenceValue();
    return `PO-${yearMonth}-${String(nextNumber).padStart(4, '0')}`;
  }
}

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, desc, eq, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  inventoryItems,
  type PurchaseOrderItem,
  purchaseOrderItems,
} from '@/db/schema';

@Injectable()
export class PurchaseOrderItemsRepository extends PrimaryBaseRepository<typeof purchaseOrderItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseOrderItems);
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
        supplierUnitPrice: purchaseOrderItems.supplierUnitPrice,
        unitPrice: purchaseOrderItems.unitPrice,
        totalPrice: purchaseOrderItems.totalPrice,
        inventoryItemName: inventoryItems.name,
      })
      .from(purchaseOrderItems)
      .leftJoin(inventoryItems, eq(purchaseOrderItems.inventoryItemId, inventoryItems.id))
      .where(eq(purchaseOrderItems.purchaseOrderId, poId));

    return rows as (PurchaseOrderItem & { inventoryItemName: string | null })[];
  }

  // Returns inventory item IDs linked to a PO
  async findItemIdsByPoId(poId: string): Promise<string[]> {
    const rows = await this.db
      .select({ inventoryItemId: purchaseOrderItems.inventoryItemId })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, poId));

    return rows.map((row) => row.inventoryItemId);
  }

  // Returns paginated PO line items for table view
  async findItemsForTable(
    poId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: (PurchaseOrderItem & { inventoryItemName: string | null })[]; count: number }> {
    const baseWhere = eq(purchaseOrderItems.purchaseOrderId, poId);
    const where = options.where ? and(baseWhere, options.where) : baseWhere;
    return this.findAllAndCount<
      PurchaseOrderItem & {
        inventoryItemName: string | null;
      }
    >({
      select: {
        id: purchaseOrderItems.id,
        organizationId: purchaseOrderItems.organizationId,
        purchaseOrderId: purchaseOrderItems.purchaseOrderId,
        inventoryItemId: purchaseOrderItems.inventoryItemId,
        orderedQuantity: purchaseOrderItems.orderedQuantity,
        receivedQuantity: purchaseOrderItems.receivedQuantity,
        supplierUnitPrice: purchaseOrderItems.supplierUnitPrice,
        unitPrice: purchaseOrderItems.unitPrice,
        totalPrice: purchaseOrderItems.totalPrice,
        inventoryItemName: inventoryItems.name,
      },
      leftJoins: [{ table: inventoryItems, on: eq(purchaseOrderItems.inventoryItemId, inventoryItems.id) }],
      where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(purchaseOrderItems.inventoryItemId)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Finds one PO line item by PO ID and item ID
  async findItemById(poId: string, itemId: string): Promise<PurchaseOrderItem | null> {
    const [item] = await this.db
      .select()
      .from(purchaseOrderItems)
      .where(and(eq(purchaseOrderItems.purchaseOrderId, poId), eq(purchaseOrderItems.id, itemId)));
    return (item as PurchaseOrderItem | undefined) ?? null;
  }

  // Finds one PO line item by PO ID and inventory item ID
  async findItemByInventoryItemId(poId: string, inventoryItemId: string): Promise<PurchaseOrderItem | null> {
    const [item] = await this.db
      .select()
      .from(purchaseOrderItems)
      .where(
        and(
          eq(purchaseOrderItems.purchaseOrderId, poId),
          eq(purchaseOrderItems.inventoryItemId, inventoryItemId),
        ),
      );
    return (item as PurchaseOrderItem | undefined) ?? null;
  }

}

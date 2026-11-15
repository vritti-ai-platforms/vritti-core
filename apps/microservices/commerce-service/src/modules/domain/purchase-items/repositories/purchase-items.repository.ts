import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { asc, eq, getColumns, sql } from '@vritti/api-sdk/drizzle-orm';
import { inventoryItems, type PurchaseItem, purchaseItemAllocations, purchaseItems, uom } from '@/db/schema';

export type PurchaseItemRow = PurchaseItem & {
  inventoryItemName: string;
  inventoryItemCode: string;
  primaryUomId: string;
  primaryUomSymbol: string | null;
  allocatedPrimaryQty: string;
};

@Injectable()
export class PurchaseItemsDomainRepository extends PrimaryBaseRepository<typeof purchaseItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, purchaseItems);
  }

  // Returns the items of a purchase with item names, primary units and allocated quantities, by item name
  findByPurchaseId(purchaseId: string): Promise<PurchaseItemRow[]> {
    return this.findAllWithSelect<PurchaseItemRow>({
      select: this.selection(),
      innerJoins: this.joins(),
      where: eq(purchaseItems.purchaseId, purchaseId),
      orderBy: [asc(inventoryItems.name)],
    });
  }

  // Loads a purchase item of the given purchase with its item name, primary unit and allocated quantity
  findDetailOnPurchase(purchaseId: string, itemId: string): Promise<PurchaseItemRow | undefined> {
    return this.findById<PurchaseItemRow>(itemId, {
      select: this.selection(),
      innerJoins: this.joins(),
      where: eq(purchaseItems.purchaseId, purchaseId),
    });
  }

  // Loads the item line of an inventory item on a purchase
  findForInventoryItem(purchaseId: string, inventoryItemId: string): Promise<PurchaseItem | undefined> {
    return this.findOne({ purchaseId, inventoryItemId });
  }

  // Selects a purchase item with its item name and code, its primary unit and the sum of its allocated primary quantities
  private selection() {
    const allocated = this.db
      .select({ total: sql`coalesce(sum(${purchaseItemAllocations.primaryUomQty}), 0)` })
      .from(purchaseItemAllocations)
      .where(eq(purchaseItemAllocations.purchaseItemId, purchaseItems.id));
    return {
      ...getColumns(purchaseItems),
      inventoryItemName: inventoryItems.name,
      inventoryItemCode: inventoryItems.sku,
      primaryUomId: inventoryItems.uomId,
      primaryUomSymbol: uom.symbol,
      allocatedPrimaryQty: sql<string>`(${allocated})`,
    };
  }

  // Joins the inventory item and its primary unit
  private joins() {
    return [
      { table: inventoryItems, on: eq(inventoryItems.id, purchaseItems.inventoryItemId) },
      { table: uom, on: eq(uom.id, inventoryItems.uomId) },
    ];
  }
}

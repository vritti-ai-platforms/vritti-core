import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq } from '@vritti/api-sdk/drizzle-orm';
import { type InventoryItemSite, inventoryItemSites } from '@/db/schema';

@Injectable()
export class InventoryItemSitesDomainRepository extends PrimaryBaseRepository<typeof inventoryItemSites> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemSites);
  }

  // Returns the projection row for an item at the current site, if any
  async findByCompositeKey(inventoryItemId: string, siteId: string): Promise<InventoryItemSite | undefined> {
    return this.model.findFirst({ where: { inventoryItemId, siteId } });
  }

  // Returns every projection row for the current site (RLS-scoped)
  async findBySite(siteId: string): Promise<InventoryItemSite[]> {
    return this.db.select().from(inventoryItemSites).where(eq(inventoryItemSites.siteId, siteId));
  }

  // Returns every projection row for a given item across the sites the caller can read
  async findByItem(inventoryItemId: string): Promise<InventoryItemSite[]> {
    return this.db.select().from(inventoryItemSites).where(eq(inventoryItemSites.inventoryItemId, inventoryItemId));
  }

  // Updates the reorder point for a projection row identified by (item, site)
  async updateReorder(inventoryItemId: string, siteId: string, reorderPoint: number): Promise<void> {
    await this.db
      .update(inventoryItemSites)
      .set({ reorderPoint })
      .where(and(eq(inventoryItemSites.inventoryItemId, inventoryItemId), eq(inventoryItemSites.siteId, siteId)));
  }
}

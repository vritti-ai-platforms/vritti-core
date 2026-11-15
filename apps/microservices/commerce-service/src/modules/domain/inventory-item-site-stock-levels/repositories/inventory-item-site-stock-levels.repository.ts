import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, getColumns, inArray, notExists, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryItemSiteStockLevel,
  inventoryItemQuants,
  inventoryItemSiteStockLevels,
  inventoryItems,
  PurchaseStatusValues,
  purchaseItems,
  purchases,
  type SiteStockLocation,
  type StockStatus,
  siteStockByItem,
  siteStockLocations,
  siteStockOnHand,
  siteStockStatus,
  siteStockValue,
} from '@/db/schema';

export type ItemSiteStockRow = InventoryItemSiteStockLevel & {
  onHand: number;
  stockValue: bigint;
  stockStatus: StockStatus;
  locations: SiteStockLocation[];
  matchesFilter: boolean;
};

@Injectable()
export class InventoryItemSiteStockLevelsDomainRepository extends PrimaryBaseRepository<
  typeof inventoryItemSiteStockLevels
> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemSiteStockLevels);
  }

  // Returns the projection row for an item at the current site, if any
  async findByCompositeKey(inventoryItemId: string, siteId: string): Promise<InventoryItemSiteStockLevel | undefined> {
    return this.model.findFirst({ where: { inventoryItemId, siteId } });
  }

  // Returns every projection row for the current site (RLS-scoped)
  async findBySite(siteId: string): Promise<InventoryItemSiteStockLevel[]> {
    return this.db.select().from(inventoryItemSiteStockLevels).where(eq(inventoryItemSiteStockLevels.siteId, siteId));
  }

  // Returns every projection row for a given item across the sites the caller can read
  async findByItem(inventoryItemId: string): Promise<InventoryItemSiteStockLevel[]> {
    return this.db
      .select()
      .from(inventoryItemSiteStockLevels)
      .where(eq(inventoryItemSiteStockLevels.inventoryItemId, inventoryItemId));
  }

  // The item's stock levels at every site the request reaches that has them, with the stock held there by location, where
  // it sits against them and whether the row passes the given filter; RLS narrows the rows to the request's sites
  findStockBySite(inventoryItemId: string, filter: SQL | undefined): Promise<ItemSiteStockRow[]> {
    return this.db
      .select({
        ...getColumns(inventoryItemSiteStockLevels),
        onHand: sql<number>`${siteStockOnHand}`.mapWith(Number),
        stockValue: sql<bigint>`${siteStockValue}`.mapWith(BigInt),
        stockStatus: sql<StockStatus>`${siteStockStatus}`,
        locations: siteStockLocations,
        matchesFilter: filter ? sql<boolean>`coalesce(${filter}, false)` : sql<boolean>`true`,
      })
      .from(inventoryItemSiteStockLevels)
      .leftJoin(
        siteStockByItem,
        and(
          eq(siteStockByItem.inventoryItemId, inventoryItemSiteStockLevels.inventoryItemId),
          eq(siteStockByItem.siteId, inventoryItemSiteStockLevels.siteId),
        ),
      )
      .where(eq(inventoryItemSiteStockLevels.inventoryItemId, inventoryItemId));
  }

  // Returns the names of the given items without stock levels at the site
  async findNamesWithoutStockLevels(siteId: string, inventoryItemIds: string[]): Promise<string[]> {
    const levelsAtSite = this.db
      .select({ id: inventoryItemSiteStockLevels.id })
      .from(inventoryItemSiteStockLevels)
      .where(
        and(
          eq(inventoryItemSiteStockLevels.inventoryItemId, inventoryItems.id),
          eq(inventoryItemSiteStockLevels.siteId, siteId),
        ),
      );
    const missing = await this.db
      .select({ name: inventoryItems.name })
      .from(inventoryItems)
      .where(and(inArray(inventoryItems.id, inventoryItemIds), notExists(levelsAtSite)));
    return missing.map((item) => item.name);
  }

  // Sums the item's quants at one site
  async findOnHandAtSite(inventoryItemId: string, siteId: string): Promise<number> {
    const [row] = await this.db
      .select({ quantity: sql<number>`coalesce(sum(${inventoryItemQuants.quantity}), 0)`.mapWith(Number) })
      .from(inventoryItemQuants)
      .where(and(eq(inventoryItemQuants.inventoryItemId, inventoryItemId), eq(inventoryItemQuants.siteId, siteId)));
    return row?.quantity ?? 0;
  }

  // Returns the numbers of the site's open purchases that include the item
  async findOpenPurchaseNumbers(inventoryItemId: string, siteId: string): Promise<string[]> {
    const rows = await this.db
      .select({ purchaseNumber: purchases.purchaseNumber })
      .from(purchases)
      .innerJoin(purchaseItems, eq(purchaseItems.purchaseId, purchases.id))
      .where(
        and(
          eq(purchases.siteId, siteId),
          eq(purchases.status, PurchaseStatusValues.OPEN),
          eq(purchaseItems.inventoryItemId, inventoryItemId),
        ),
      )
      .orderBy(asc(purchases.purchaseNumber));
    return rows.map((row) => row.purchaseNumber);
  }
}

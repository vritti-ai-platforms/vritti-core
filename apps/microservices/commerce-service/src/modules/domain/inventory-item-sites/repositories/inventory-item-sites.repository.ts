import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, getColumns, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, ConflictException, NotFoundException } from '@vritti/api-sdk/exceptions';
import {
  currentSiteId,
  type DisplayUnitRatios,
  displayUnitRatios,
  GoodsReceiptStatusValues,
  goodsReceiptItems,
  goodsReceipts,
  type InventoryItemSite,
  inventoryItemQuants,
  inventoryItemSites,
  inventoryItems,
  itemStockAtSite,
  PurchaseStatusValues,
  purchaseItems,
  purchases,
  SiteItemStatusValues,
  type SiteStockLocation,
  StockAdjustmentStatusValues,
  type StockStatus,
  StockTransferStatusValues,
  siteStockByItem,
  siteStockLocations,
  siteStockOnHand,
  siteStockStatus,
  siteStockValue,
  stockAdjustments,
  stockStatusSql,
  stockTransfers,
  uom,
} from '@/db/schema';

export type SiteItemCounts = { requested: number; carried: number; blocked: number };

export type SiteItemUsage = {
  onHand: number;
  openPurchaseNumbers: string[];
  draftAdjustmentCodes: string[];
  draftReceiptNumbers: string[];
  incomingTransferCount: number;
};

export type SiteItemStockRow = Omit<ItemSiteStockRow, 'matchesFilter'>;

export type ItemSiteStockRow = InventoryItemSite & {
  onHand: number;
  stockValue: bigint;
  stockStatus: StockStatus;
  locations: SiteStockLocation[];
  displayUnitRatios: DisplayUnitRatios;
  matchesFilter: boolean;
};

@Injectable()
export class InventoryItemSitesDomainRepository extends PrimaryBaseRepository<typeof inventoryItemSites> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItemSites);
  }

  // Returns how the named site, else the request's site, carries the item, if it does
  async findByCompositeKey(inventoryItemId: string, siteId?: string): Promise<InventoryItemSite | undefined> {
    const [siteItem] = await this.findAllWithSelect<InventoryItemSite>({
      where: and(
        eq(inventoryItemSites.inventoryItemId, inventoryItemId),
        eq(inventoryItemSites.siteId, siteId ?? currentSiteId()),
      ),
    });
    return siteItem;
  }

  // Whether the item's primary unit can be counted in fractions, which its stock levels follow
  async findUnitAllowsDecimal(inventoryItemId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ allowDecimal: uom.allowDecimal })
      .from(inventoryItems)
      .innerJoin(uom, eq(uom.id, inventoryItems.uomId))
      .where(eq(inventoryItems.id, inventoryItemId));
    return row.allowDecimal;
  }

  // Returns every item the site carries
  async findBySite(siteId: string): Promise<InventoryItemSite[]> {
    return this.db.select().from(inventoryItemSites).where(eq(inventoryItemSites.siteId, siteId));
  }

  // Returns every site carrying the item that the caller can read
  async findByItem(inventoryItemId: string): Promise<InventoryItemSite[]> {
    return this.db.select().from(inventoryItemSites).where(eq(inventoryItemSites.inventoryItemId, inventoryItemId));
  }

  // Every site the request reaches that carries the item, with the stock held there by location, where it sits against
  // the site's levels, the ratios to the item's display unit and whether the row passes the given filter; RLS narrows the
  // rows to the request's sites
  findStockBySite(inventoryItemId: string, filter: SQL | undefined): Promise<ItemSiteStockRow[]> {
    return this.db
      .select({
        ...getColumns(inventoryItemSites),
        onHand: sql<number>`${siteStockOnHand}`.mapWith(Number),
        stockValue: sql<bigint>`${siteStockValue}`.mapWith(BigInt),
        stockStatus: sql<StockStatus>`${siteStockStatus}`,
        locations: siteStockLocations,
        displayUnitRatios: displayUnitRatios(),
        matchesFilter: filter ? sql<boolean>`coalesce(${filter}, false)` : sql<boolean>`true`,
      })
      .from(inventoryItemSites)
      .innerJoin(inventoryItems, eq(inventoryItems.id, inventoryItemSites.inventoryItemId))
      .leftJoin(
        siteStockByItem,
        and(
          eq(siteStockByItem.inventoryItemId, inventoryItemSites.inventoryItemId),
          eq(siteStockByItem.siteId, inventoryItemSites.siteId),
        ),
      )
      .where(eq(inventoryItemSites.inventoryItemId, inventoryItemId));
  }

  // Of the given items, how many the named site, else the request's site, carries and how many of those it has blocked
  // buying, in one query
  async countAtSite(inventoryItemIds: string[], siteId?: string): Promise<SiteItemCounts> {
    const uniqueIds = [...new Set(inventoryItemIds)];
    const [row] = await this.db
      .select({
        carried: sql<number>`count(*)`.mapWith(Number),
        blocked:
          sql<number>`count(*) filter (where ${inventoryItemSites.status} = ${SiteItemStatusValues.BLOCKED})`.mapWith(
            Number,
          ),
      })
      .from(inventoryItemSites)
      .where(
        and(
          inArray(inventoryItemSites.inventoryItemId, uniqueIds),
          eq(inventoryItemSites.siteId, siteId ?? currentSiteId()),
        ),
      );
    return { requested: uniqueIds.length, ...row };
  }

  // Returns how the site carries the item and the stock it holds there by location, valued and placed against the site's
  // levels, with the ratios to the item's display unit; undefined while the site does not carry it
  async findStockAtSite(inventoryItemId: string, siteId: string): Promise<SiteItemStockRow | undefined> {
    const stock = itemStockAtSite(inventoryItemSites.inventoryItemId, inventoryItemSites.siteId);
    const [row] = await this.db
      .select({
        ...getColumns(inventoryItemSites),
        onHand: sql<number>`${stock.onHand}`.mapWith(Number),
        stockValue: sql<bigint>`${stock.value}`.mapWith(BigInt),
        stockStatus: sql<StockStatus>`${stockStatusSql(stock.onHand)}`,
        locations: stock.locations,
        displayUnitRatios: displayUnitRatios(),
      })
      .from(inventoryItemSites)
      .innerJoin(inventoryItems, eq(inventoryItems.id, inventoryItemSites.inventoryItemId))
      .where(and(eq(inventoryItemSites.inventoryItemId, inventoryItemId), eq(inventoryItemSites.siteId, siteId)));
    return row;
  }

  // Returns the given items whose purchasing the named site, else the request's site, has blocked
  async findBlockedItemIds(inventoryItemIds: string[], siteId?: string): Promise<string[]> {
    const rows = await this.findAllWithSelect<{ inventoryItemId: string }>({
      select: { inventoryItemId: inventoryItemSites.inventoryItemId },
      where: and(
        inArray(inventoryItemSites.inventoryItemId, inventoryItemIds),
        eq(inventoryItemSites.siteId, siteId ?? currentSiteId()),
        eq(inventoryItemSites.status, SiteItemStatusValues.BLOCKED),
      ),
    });
    return rows.map((row) => row.inventoryItemId);
  }

  // Returns the given items the site carries with buying them tied to the supplier's item set up there
  async findSupplierItemsRequiredIds(inventoryItemIds: string[], siteId: string): Promise<string[]> {
    const rows = await this.findAllWithSelect<{ inventoryItemId: string }>({
      select: { inventoryItemId: inventoryItemSites.inventoryItemId },
      where: and(
        inArray(inventoryItemSites.inventoryItemId, inventoryItemIds),
        eq(inventoryItemSites.siteId, siteId),
        eq(inventoryItemSites.supplierItemsRequired, true),
      ),
    });
    return rows.map((row) => row.inventoryItemId);
  }

  // What still ties the item to the site: the stock it holds there, the open purchases and draft stock adjustments and
  // goods receipts that include it, and the transfers of it still to be received there
  async findUsage({ id, inventoryItemId, siteId }: InventoryItemSite): Promise<SiteItemUsage> {
    const [row] = await this.db
      .select({
        onHand: sql<number>`coalesce((${this.db
          .select({ total: sql`sum(${inventoryItemQuants.quantity})` })
          .from(inventoryItemQuants)
          .where(
            and(eq(inventoryItemQuants.inventoryItemId, inventoryItemId), eq(inventoryItemQuants.siteId, siteId)),
          )}), 0)`.mapWith(Number),
        openPurchaseNumbers: sql<string[]>`coalesce((${this.db
          .select({
            numbers: sql`array_agg(distinct ${purchases.purchaseNumber} order by ${purchases.purchaseNumber})`,
          })
          .from(purchases)
          .innerJoin(purchaseItems, eq(purchaseItems.purchaseId, purchases.id))
          .where(
            and(
              eq(purchases.siteId, siteId),
              eq(purchases.status, PurchaseStatusValues.OPEN),
              eq(purchaseItems.inventoryItemId, inventoryItemId),
            ),
          )}), '{}')`,
        draftAdjustmentCodes: sql<string[]>`coalesce((${this.db
          .select({ codes: sql`array_agg(${stockAdjustments.code} order by ${stockAdjustments.code})` })
          .from(stockAdjustments)
          .where(
            and(
              eq(stockAdjustments.siteId, siteId),
              eq(stockAdjustments.status, StockAdjustmentStatusValues.DRAFT),
              eq(stockAdjustments.inventoryItemId, inventoryItemId),
            ),
          )}), '{}')`,
        draftReceiptNumbers: sql<string[]>`coalesce((${this.db
          .select({ numbers: sql`array_agg(distinct ${goodsReceipts.grNumber} order by ${goodsReceipts.grNumber})` })
          .from(goodsReceipts)
          .innerJoin(goodsReceiptItems, eq(goodsReceiptItems.goodsReceiptId, goodsReceipts.id))
          .where(
            and(
              eq(goodsReceipts.siteId, siteId),
              eq(goodsReceipts.status, GoodsReceiptStatusValues.DRAFT),
              eq(goodsReceiptItems.inventoryItemId, inventoryItemId),
            ),
          )}), '{}')`,
        incomingTransferCount: sql<number>`(${this.db
          .select({ count: sql`count(*)` })
          .from(stockTransfers)
          .where(
            and(
              eq(stockTransfers.toSiteId, siteId),
              inArray(stockTransfers.status, [
                StockTransferStatusValues.REQUESTED,
                StockTransferStatusValues.IN_TRANSIT,
              ]),
              eq(stockTransfers.inventoryItemId, inventoryItemId),
            ),
          )})`.mapWith(Number),
      })
      .from(inventoryItemSites)
      .where(eq(inventoryItemSites.id, id));
    return row;
  }

  // Loads how the named site, else the request's site, carries the item, or 404s when it does not
  async findAtSiteOrThrow(inventoryItemId: string, siteId?: string): Promise<InventoryItemSite> {
    const siteItem = await this.findByCompositeKey(inventoryItemId, siteId);
    if (!siteItem) throw new NotFoundException('The site does not carry this item.');
    return siteItem;
  }

  // Rejects items the named site, else the request's site, does not carry; nothing of them is bought, received or
  // stocked there until they are added to it
  async isAddedToSite(inventoryItemIds: string[], field: string, siteId?: string): Promise<void> {
    this.assertCarried(await this.countAtSite(inventoryItemIds, siteId), field);
  }

  // Rejects items the site does not carry or has blocked from purchasing, from one count; the purchase's items mark which
  // and why
  async canPurchaseAtSite(inventoryItemIds: string[], field: string, siteId?: string): Promise<void> {
    const counts = await this.countAtSite(inventoryItemIds, siteId);
    this.assertCarried(counts, field);
    if (counts.blocked === 0) return;
    throw new ConflictException({
      label: 'Purchasing Blocked',
      detail: 'This site has blocked buying an item; remove it before buying.',
      errors: [{ field, message: 'Purchasing blocked at this site' }],
    });
  }

  // Rejects the counted items unless the site carries every one of them
  private assertCarried(counts: SiteItemCounts, field: string): void {
    if (counts.carried === counts.requested) return;
    throw new BadRequestException({
      label: 'Not at Site',
      detail: 'An item must be added to this site before it is bought, received or stocked here.',
      errors: [{ field, message: 'Not carried at this site' }],
    });
  }
}

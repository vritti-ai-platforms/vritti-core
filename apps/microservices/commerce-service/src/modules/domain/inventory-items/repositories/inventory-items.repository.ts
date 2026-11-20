import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, exists, getColumns, gt, inArray, notExists, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type AnyPgColumn, alias, QueryBuilder, union } from '@vritti/api-sdk/drizzle-pg-core';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import {
  categories,
  type DisplayUnitRatios,
  displayUnitRatios,
  hasSupplierItem,
  type InventoryItem,
  inventoryItemQuants,
  inventoryItemSites,
  inventoryItems,
  inventoryItemUomConversions,
  itemStockAtSite,
  locations,
  purchaseItems,
  purchaseOrderItems,
  type ReplenishmentMethod,
  type SiteItemStatus,
  type SiteStockLocation,
  type StockStatus,
  siteStockByItem,
  siteStockLocations,
  siteStockOnHand,
  siteStockStatus,
  siteStockStatusMatchesSql,
  siteStockValue,
  stockAdjustments,
  stockStatusSql,
  stockTransfers,
  supplierItems,
  taxClasses,
  uom,
} from '@/db/schema';

export type InventoryItemNames = {
  uomSymbol: string;
  uomAllowDecimal: boolean;
  displayUomSymbol: string;
  categoryName: string;
  taxClassName: string;
};

type TableRow = InventoryItem & InventoryItemNames;

export type SiteStockTableRow = TableRow & {
  atSite: boolean;
  siteItemStatus: SiteItemStatus | null;
  blockedReason: string | null;
  replenishment: ReplenishmentMethod | null;
  reorderPoint: number | null;
  safetyStock: number | null;
  maxStock: number | null;
  onHand: number;
  stockValue: bigint;
  stockStatus: StockStatus | null;
  locations: SiteStockLocation[];
  displayUnitRatios: DisplayUnitRatios;
};

// A UOM's family: the base unit it converts to, or itself when it is a base unit
const uomFamily = (unit: { id: AnyPgColumn; baseUnitId: AnyPgColumn }) => sql`coalesce(${unit.baseUnitId}, ${unit.id})`;

// The UOMs an inventory item can transact in: every UOM in its primary UOM's family, and every per-item conversion; by
// default those of the item read alongside
function allowedUomsOfItem(
  item: { id: AnyPgColumn | string; uomId: AnyPgColumn | string } = {
    id: inventoryItems.id,
    uomId: inventoryItems.uomId,
  },
) {
  const primaryUom = alias(uom, 'primary_uom');
  const familyUom = alias(uom, 'family_uom');
  return union(
    new QueryBuilder()
      .select({ uomId: familyUom.id })
      .from(familyUom)
      .innerJoin(primaryUom, eq(uomFamily(familyUom), uomFamily(primaryUom)))
      .where(eq(primaryUom.id, item.uomId)),
    new QueryBuilder()
      .select({ uomId: inventoryItemUomConversions.uomId })
      .from(inventoryItemUomConversions)
      .where(eq(inventoryItemUomConversions.inventoryItemId, item.id)),
  ).as('allowed_uoms');
}

// The symbol of the unit the inventory item read alongside is displayed in
const displayUomSymbol = () =>
  sql<string>`(${new QueryBuilder().select({ symbol: uom.symbol }).from(uom).where(eq(uom.id, inventoryItems.displayUomId))})`;

// Whether the site holds stock of the item in any of the given locations or anywhere below them
export function stockHeldUnderLocationsSql(locationIds: string[]): SQL {
  const picked = alias(locations, 'picked');
  return exists(
    new QueryBuilder()
      .select({ id: inventoryItemQuants.id })
      .from(inventoryItemQuants)
      .innerJoin(locations, eq(locations.id, inventoryItemQuants.locationId))
      .innerJoin(picked, and(inArray(picked.id, locationIds), sql`${locations.path} <@ ${picked.path}`))
      .where(and(eq(inventoryItemQuants.inventoryItemId, inventoryItems.id), gt(inventoryItemQuants.quantity, 0))),
  );
}

// Whether one of the sites carries the item
export function carriedAtSitesSql(siteIds: string[]): SQL {
  return exists(
    new QueryBuilder()
      .select({ id: inventoryItemSites.id })
      .from(inventoryItemSites)
      .where(
        and(eq(inventoryItemSites.inventoryItemId, inventoryItems.id), inArray(inventoryItemSites.siteId, siteIds)),
      ),
  );
}

@Injectable()
export class InventoryItemsDomainRepository extends PrimaryBaseRepository<typeof inventoryItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItems);
  }

  // Returns paginated inventory item options for select dropdowns.
  override async findForSelect(
    config: FindForSelectConfig,
    options?: {
      excludeOnSupplierId?: string;
      // Only the items this site does not carry yet
      notAtSiteId?: string;
      notOnPurchaseId?: string;
      // Only the items filed under one of these categories
      categoryIds?: string[];
      // Only the items this site carries, each with its stock and levels there
      atSiteId?: string;
      // With a site, only the items whose stock there has one of these statuses
      stockStatus?: string[];
      // With a site, marks the items the legal entity set up as the supplier's items and leaves out the others where the
      // site's rules require them — every item while the site's own rule is on, else the ones it ties to it
      supplier?: { supplierId: string; siteRequires: boolean };
    },
  ): Promise<SelectQueryResult> {
    const conditions: SQL[] = [];

    if (options?.notAtSiteId) {
      const atSite = this.db
        .select({ id: inventoryItemSites.id })
        .from(inventoryItemSites)
        .where(
          and(
            eq(inventoryItemSites.inventoryItemId, inventoryItems.id),
            eq(inventoryItemSites.siteId, options.notAtSiteId),
          ),
        );
      conditions.push(notExists(atSite));
    }

    if (options?.notOnPurchaseId) {
      const onPurchase = this.db
        .select({ id: purchaseItems.id })
        .from(purchaseItems)
        .where(
          and(
            eq(purchaseItems.purchaseId, options.notOnPurchaseId),
            eq(purchaseItems.inventoryItemId, inventoryItems.id),
          ),
        );
      conditions.push(notExists(onPurchase));
    }

    // Only the items the site carries, through the inner join on its site items below; each row's stock is read per
    // item, so a page adds up only its own items' stock, not everything the site holds
    const stock = itemStockAtSite(inventoryItems.id, inventoryItemSites.siteId);
    const stockStatus = stockStatusSql(stock.onHand);
    if (options?.atSiteId) {
      conditions.push(eq(inventoryItemSites.siteId, options.atSiteId));
      if (options.stockStatus?.length) conditions.push(siteStockStatusMatchesSql(options.stockStatus, stockStatus));
    }

    const supplied = options?.supplier ? hasSupplierItem(options.supplier.supplierId, inventoryItems.id) : undefined;
    if (options?.atSiteId && options.supplier && supplied) {
      conditions.push(
        options.supplier.siteRequires
          ? supplied
          : (or(eq(inventoryItemSites.supplierItemsRequired, false), supplied) as SQL),
      );
    }

    if (options?.categoryIds?.length) conditions.push(inArray(inventoryItems.categoryId, options.categoryIds));

    if (options?.excludeOnSupplierId) {
      const allowedUoms = allowedUomsOfItem();
      const onSupplier = new QueryBuilder()
        .select({ id: supplierItems.id })
        .from(supplierItems)
        .where(
          and(
            eq(supplierItems.supplierId, options.excludeOnSupplierId),
            eq(supplierItems.inventoryItemId, inventoryItems.id),
            eq(supplierItems.uomId, allowedUoms.uomId),
          ),
        );
      conditions.push(
        exists(new QueryBuilder().select({ uomId: allowedUoms.uomId }).from(allowedUoms).where(notExists(onSupplier))),
      );
    }

    return super.findForSelect({
      ...config,
      joins: [
        { table: uom, on: eq(inventoryItems.uomId, uom.id), type: 'inner' },
        ...(options?.atSiteId
          ? [
              {
                table: inventoryItemSites,
                on: eq(inventoryItemSites.inventoryItemId, inventoryItems.id),
                type: 'inner' as const,
              },
            ]
          : []),
      ],
      // Each item's unit and, at a site, its stock there against its levels, how the site carries it and the ratios that
      // turn its quantities into the item's display unit, for the picker to show beside it
      additionalExpressions: {
        uomSymbol: sql<string>`${uom.symbol}`,
        allowDecimal: sql<boolean>`${uom.allowDecimal}`,
        ...(options?.atSiteId
          ? {
              onHand: sql<number>`${stock.onHand}`.mapWith(Number),
              siteItemStatus: sql<SiteItemStatus>`${inventoryItemSites.status}`,
              blockedReason: sql<string | null>`${inventoryItemSites.blockedReason}`,
              replenishment: sql<ReplenishmentMethod>`${inventoryItemSites.replenishment}`,
              safetyStock: sql<number | null>`${inventoryItemSites.safetyStock}`.mapWith(Number),
              reorderPoint: sql<number | null>`${inventoryItemSites.reorderPoint}`.mapWith(Number),
              maxStock: sql<number | null>`${inventoryItemSites.maxStock}`.mapWith(Number),
              stockStatus,
              stockValue: stock.value,
              locations: stock.locations,
              displayUnitRatios: displayUnitRatios(),
            }
          : {}),
        ...(options?.atSiteId && options.supplier && supplied
          ? {
              suppliedBySupplier: sql<boolean>`${supplied}`,
              supplierItemsRequired: options.supplier.siteRequires
                ? sql<boolean>`true`
                : sql<boolean>`${inventoryItemSites.supplierItemsRequired}`,
            }
          : {}),
      },
      groupTable: config.groupIdKey === 'categoryId' ? categories : undefined,
      conditions,
    });
  }

  // The UOMs an item can transact in: its primary UOM's family and every per-item conversion
  async findAllowedUomIds(inventoryItemId: string): Promise<string[]> {
    const allowedUoms = allowedUomsOfItem();
    const rows = await this.db
      .select({ uomId: allowedUoms.uomId })
      .from(inventoryItems)
      .crossJoinLateral(allowedUoms)
      .where(eq(inventoryItems.id, inventoryItemId));
    return rows.map((row) => row.uomId);
  }

  // The UOMs an inventory item can transact in once its primary UOM is the given one: that UOM's family and every
  // per-item conversion
  async findAllowedUomIdsFor(inventoryItemId: string, primaryUomId: string): Promise<string[]> {
    const allowedUoms = allowedUomsOfItem({ id: inventoryItemId, uomId: primaryUomId });
    const rows = await this.db.select({ uomId: allowedUoms.uomId }).from(allowedUoms);
    return rows.map((row) => row.uomId);
  }

  // Returns paginated inventory items with their unit's symbol
  async findAllWithUom(options?: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: (typeof inventoryItems.$inferSelect & {
      uomSymbol: string;
      uomAllowDecimal: boolean;
      displayUomSymbol: string;
      categoryName: string;
      taxClassName: string;
    })[];
    count: number;
  }> {
    return this.findAllAndCount({
      select: {
        ...inventoryItems,
        uomSymbol: uom.symbol,
        uomAllowDecimal: uom.allowDecimal,
        displayUomSymbol: displayUomSymbol(),
        categoryName: sql<string>`(
          SELECT c.name
          FROM ${categories} c
          WHERE c.id = ${inventoryItems.categoryId}
        )`,
        taxClassName: sql<string>`(
          SELECT t.name
          FROM ${taxClasses} t
          WHERE t.id = ${inventoryItems.taxClassId}
        )`,
      },
      innerJoin: { table: uom, on: eq(inventoryItems.uomId, uom.id) },
      where: options?.where,
      orderBy: options?.orderBy,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  // Returns up to limit+1 inventory items with their unit's symbol for keyset pagination
  async findKeysetWithUom(options: { where?: SQL; orderBy: SQL[]; limit: number }): Promise<{
    rows: (typeof inventoryItems.$inferSelect & {
      uomSymbol: string;
      uomAllowDecimal: boolean;
      displayUomSymbol: string;
      categoryName: string;
      taxClassName: string;
    })[];
    hasMore: boolean;
  }> {
    return this.findKeyset({
      select: {
        ...inventoryItems,
        uomSymbol: uom.symbol,
        uomAllowDecimal: uom.allowDecimal,
        displayUomSymbol: displayUomSymbol(),
        categoryName: sql<string>`(
          SELECT c.name
          FROM ${categories} c
          WHERE c.id = ${inventoryItems.categoryId}
        )`,
        taxClassName: sql<string>`(
          SELECT t.name
          FROM ${taxClasses} t
          WHERE t.id = ${inventoryItems.taxClassId}
        )`,
      },
      leftJoin: { table: uom, on: eq(inventoryItems.uomId, uom.id) },
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
    });
  }

  // Returns a single inventory item with its unit's symbol and its category and tax class names
  async findByIdWithUomAndCategory(id: string): Promise<
    | (typeof inventoryItems.$inferSelect & {
        uomSymbol: string;
        uomAllowDecimal: boolean;
        displayUomSymbol: string;
        categoryName: string;
        taxClassName: string;
      })
    | null
  > {
    const [row] = await this.db
      .select({
        ...getColumns(inventoryItems),
        uomSymbol: uom.symbol,
        uomAllowDecimal: uom.allowDecimal,
        displayUomSymbol: displayUomSymbol(),
        categoryName: categories.name,
        taxClassName: taxClasses.name,
      })
      .from(inventoryItems)
      .innerJoin(uom, eq(inventoryItems.uomId, uom.id))
      .innerJoin(categories, eq(inventoryItems.categoryId, categories.id))
      .innerJoin(taxClasses, eq(inventoryItems.taxClassId, taxClasses.id))
      .where(eq(inventoryItems.id, id))
      .limit(1);

    return row ?? null;
  }

  // Org-wide master list (no site filter — RLS scopes to org). Alias of findAllWithUom for the master table.
  findForOrgTable(options?: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: TableRow[];
    count: number;
  }> {
    return this.findAllWithUom(options);
  }

  // The master columns every scope's table shows, with the names its foreign keys point at
  private tableColumns() {
    return {
      ...getColumns(inventoryItems),
      uomSymbol: sql<string>`(${this.db
        .select({ symbol: uom.symbol })
        .from(uom)
        .where(eq(uom.id, inventoryItems.uomId))})`,
      uomAllowDecimal: sql<boolean>`(${this.db
        .select({ allowDecimal: uom.allowDecimal })
        .from(uom)
        .where(eq(uom.id, inventoryItems.uomId))})`,
      displayUomSymbol: displayUomSymbol(),
      categoryName: sql<string>`(${this.db
        .select({ name: categories.name })
        .from(categories)
        .where(eq(categories.id, inventoryItems.categoryId))})`,
      taxClassName: sql<string>`(${this.db
        .select({ name: taxClasses.name })
        .from(taxClasses)
        .where(eq(taxClasses.id, inventoryItems.taxClassId))})`,
    };
  }

  // Every master item with how the site carries it, when it does, the stock the site holds of it by location and its
  // stock status; RLS narrows the site items and quants to the request's site
  async findForSiteStockTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: SiteStockTableRow[]; count: number }> {
    return this.findAllAndCount<SiteStockTableRow>({
      select: {
        ...this.tableColumns(),
        atSite: sql<boolean>`${inventoryItemSites.id} IS NOT NULL`,
        siteItemStatus: inventoryItemSites.status,
        blockedReason: inventoryItemSites.blockedReason,
        replenishment: inventoryItemSites.replenishment,
        reorderPoint: inventoryItemSites.reorderPoint,
        safetyStock: inventoryItemSites.safetyStock,
        maxStock: inventoryItemSites.maxStock,
        onHand: sql<number>`${siteStockOnHand}`.mapWith(Number),
        stockValue: sql<bigint>`${siteStockValue}`.mapWith(BigInt),
        stockStatus: siteStockStatus,
        locations: siteStockLocations,
        displayUnitRatios: displayUnitRatios(),
      },
      leftJoins: [
        {
          table: inventoryItemSites,
          on: eq(inventoryItemSites.inventoryItemId, inventoryItems.id),
        },
        { table: siteStockByItem, on: eq(siteStockByItem.inventoryItemId, inventoryItems.id) },
      ],
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns a unit's symbol and whether it can be counted in fractions
  async findUnit(uomId: string): Promise<Pick<InventoryItemNames, 'uomSymbol' | 'uomAllowDecimal'>> {
    const [row] = await this.db
      .select({ uomSymbol: uom.symbol, uomAllowDecimal: uom.allowDecimal })
      .from(uom)
      .where(eq(uom.id, uomId));
    return row;
  }

  // Returns category name for a given category ID
  async findCategoryName(categoryId: string): Promise<string> {
    const [row] = await this.db.select({ name: categories.name }).from(categories).where(eq(categories.id, categoryId));
    return row.name;
  }

  // Returns the tax class name for a given tax class ID
  async findTaxClassName(taxClassId: string): Promise<string> {
    const [row] = await this.db.select({ name: taxClasses.name }).from(taxClasses).where(eq(taxClasses.id, taxClassId));
    return row.name;
  }

  // Returns a set of inventory item IDs that have at least one non-cascading reference
  async findReferencedIds(ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const [adj, transfers, poItems] = await Promise.all([
      this.db
        .select({ id: stockAdjustments.inventoryItemId })
        .from(stockAdjustments)
        .where(inArray(stockAdjustments.inventoryItemId, ids)),
      this.db
        .select({ id: stockTransfers.inventoryItemId })
        .from(stockTransfers)
        .where(inArray(stockTransfers.inventoryItemId, ids)),
      this.db
        .select({ id: purchaseOrderItems.inventoryItemId })
        .from(purchaseOrderItems)
        .where(inArray(purchaseOrderItems.inventoryItemId, ids)),
    ]);
    const referenced = new Set<string>();
    for (const row of [...adj, ...transfers, ...poItems]) {
      if (row.id) referenced.add(row.id);
    }
    return referenced;
  }

  // Counts non-cascading references for a specific inventory item
  async countReferences(id: string): Promise<{
    stockAdjustments: number;
    stockTransfers: number;
    purchaseOrderItems: number;
  }> {
    const [adjResult, transferResult, poResult] = await Promise.all([
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(stockAdjustments)
        .where(eq(stockAdjustments.inventoryItemId, id)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(stockTransfers)
        .where(eq(stockTransfers.inventoryItemId, id)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.inventoryItemId, id)),
    ]);
    return {
      stockAdjustments: Number(adjResult[0]?.count ?? 0),
      stockTransfers: Number(transferResult[0]?.count ?? 0),
      purchaseOrderItems: Number(poResult[0]?.count ?? 0),
    };
  }
}

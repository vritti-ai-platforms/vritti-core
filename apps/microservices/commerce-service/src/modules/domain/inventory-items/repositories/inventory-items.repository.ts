import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, exists, getColumns, gt, inArray, notExists, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type AnyPgColumn, alias, QueryBuilder, union } from '@vritti/api-sdk/drizzle-pg-core';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import {
  categories,
  type InventoryItem,
  inventoryItemQuants,
  inventoryItemSiteStockLevels,
  inventoryItems,
  inventoryItemUomConversions,
  itemStockAtSite,
  locations,
  purchaseOrderItems,
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

type TableRow = InventoryItem & { uomSymbol: string | null; categoryName: string | null; taxClassName: string | null };

export type SiteStockTableRow = TableRow & {
  hasStockLevels: boolean;
  reorderPoint: number | null;
  safetyStock: number | null;
  maxStockLevel: number | null;
  onHand: number;
  stockValue: bigint;
  stockStatus: StockStatus | null;
  locations: SiteStockLocation[];
};

// A UOM's family: the base unit it converts to, or itself when it is a base unit
const uomFamily = (unit: { id: AnyPgColumn; baseUnitId: AnyPgColumn }) => sql`coalesce(${unit.baseUnitId}, ${unit.id})`;

// The UOMs the inventory item read alongside can transact in: every UOM in its primary UOM's family, and every per-item
// conversion
function allowedUomsOfItem() {
  const primaryUom = alias(uom, 'primary_uom');
  const familyUom = alias(uom, 'family_uom');
  return union(
    new QueryBuilder()
      .select({ uomId: familyUom.id })
      .from(familyUom)
      .innerJoin(primaryUom, eq(uomFamily(familyUom), uomFamily(primaryUom)))
      .where(eq(primaryUom.id, inventoryItems.uomId)),
    new QueryBuilder()
      .select({ uomId: inventoryItemUomConversions.uomId })
      .from(inventoryItemUomConversions)
      .where(eq(inventoryItemUomConversions.inventoryItemId, inventoryItems.id)),
  ).as('allowed_uoms');
}

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
      withoutStockLevels?: boolean;
      // Only the items filed under one of these categories
      categoryIds?: string[];
      stockLevelsAtSiteId?: string;
      // With a site, only the items whose stock there has one of these statuses
      stockStatus?: string[];
    },
  ): Promise<SelectQueryResult> {
    const conditions: SQL[] = [];

    // RLS narrows the stock levels to the request's site
    if (options?.withoutStockLevels) {
      const stockLevels = this.db
        .select({ id: inventoryItemSiteStockLevels.id })
        .from(inventoryItemSiteStockLevels)
        .where(eq(inventoryItemSiteStockLevels.inventoryItemId, inventoryItems.id));
      conditions.push(notExists(stockLevels));
    }

    // Only the items with stock levels set at the site, through the inner join on their stock levels below; each row's
    // stock is read per item, so a page adds up only its own items' stock, not everything the site holds
    const stock = itemStockAtSite(inventoryItems.id, inventoryItemSiteStockLevels.siteId);
    const stockStatus = stockStatusSql(stock.onHand);
    if (options?.stockLevelsAtSiteId) {
      conditions.push(eq(inventoryItemSiteStockLevels.siteId, options.stockLevelsAtSiteId));
      if (options.stockStatus?.length) conditions.push(siteStockStatusMatchesSql(options.stockStatus, stockStatus));
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
        { table: uom, on: eq(inventoryItems.uomId, uom.id), type: 'left' },
        ...(options?.stockLevelsAtSiteId
          ? [
              {
                table: inventoryItemSiteStockLevels,
                on: eq(inventoryItemSiteStockLevels.inventoryItemId, inventoryItems.id),
                type: 'inner' as const,
              },
            ]
          : []),
      ],
      // Each item's stock at the site against its levels there, for the picker to show beside the item
      additionalExpressions: options?.stockLevelsAtSiteId
        ? {
            onHand: sql<number>`${stock.onHand}`.mapWith(Number),
            safetyStock: sql<number>`${inventoryItemSiteStockLevels.safetyStock}`.mapWith(Number),
            reorderPoint: sql<number>`${inventoryItemSiteStockLevels.reorderPoint}`.mapWith(Number),
            maxStockLevel: sql<number>`${inventoryItemSiteStockLevels.maxStockLevel}`.mapWith(Number),
            stockStatus,
            stockValue: stock.value,
            locations: stock.locations,
            uomSymbol: sql<string | null>`${uom.symbol}`,
            allowDecimal: sql<boolean | null>`${uom.allowDecimal}`,
          }
        : undefined,
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

  // Returns paginated inventory items with UOM symbol via LEFT JOIN
  async findAllWithUom(options?: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: (typeof inventoryItems.$inferSelect & {
      uomSymbol: string | null;
      categoryName: string | null;
      taxClassName: string | null;
    })[];
    count: number;
  }> {
    return this.findAllAndCount({
      select: {
        ...inventoryItems,
        uomSymbol: uom.symbol,
        categoryName: sql<string | null>`(
          SELECT c.name
          FROM ${categories} c
          WHERE c.id = ${inventoryItems.categoryId}
        )`,
        taxClassName: sql<string | null>`(
          SELECT t.name
          FROM ${taxClasses} t
          WHERE t.id = ${inventoryItems.taxClassId}
        )`,
      },
      leftJoin: { table: uom, on: eq(inventoryItems.uomId, uom.id) },
      where: options?.where,
      orderBy: options?.orderBy,
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  // Returns up to limit+1 inventory items with UOM symbol via LEFT JOIN for keyset pagination
  async findKeysetWithUom(options: { where?: SQL; orderBy: SQL[]; limit: number }): Promise<{
    rows: (typeof inventoryItems.$inferSelect & {
      uomSymbol: string | null;
      categoryName: string | null;
      taxClassName: string | null;
    })[];
    hasMore: boolean;
  }> {
    return this.findKeyset({
      select: {
        ...inventoryItems,
        uomSymbol: uom.symbol,
        categoryName: sql<string | null>`(
          SELECT c.name
          FROM ${categories} c
          WHERE c.id = ${inventoryItems.categoryId}
        )`,
        taxClassName: sql<string | null>`(
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

  // Returns a single inventory item with UOM symbol and category name via LEFT JOINs
  async findByIdWithUomAndCategory(id: string): Promise<
    | (typeof inventoryItems.$inferSelect & {
        uomSymbol: string | null;
        categoryName: string | null;
        taxClassName: string | null;
      })
    | null
  > {
    const [row] = await this.db
      .select({
        ...getColumns(inventoryItems),
        uomSymbol: uom.symbol,
        categoryName: categories.name,
        taxClassName: taxClasses.name,
      })
      .from(inventoryItems)
      .leftJoin(uom, eq(inventoryItems.uomId, uom.id))
      .leftJoin(categories, eq(inventoryItems.categoryId, categories.id))
      .leftJoin(taxClasses, eq(inventoryItems.taxClassId, taxClasses.id))
      .where(eq(inventoryItems.id, id))
      .limit(1);

    return row ?? null;
  }

  // Org-wide master list (no site filter — RLS scopes to org). Alias of findAllWithUom for the master table.
  findForOrgTable(options?: { where?: SQL; orderBy?: SQL[]; limit?: number; offset?: number }): Promise<{
    result: (InventoryItem & { uomSymbol: string | null; categoryName: string | null; taxClassName: string | null })[];
    count: number;
  }> {
    return this.findAllWithUom(options);
  }

  // The master columns every scope's table shows, with the names its foreign keys point at
  private tableColumns() {
    return {
      ...getColumns(inventoryItems),
      uomSymbol: sql<string | null>`(${this.db
        .select({ symbol: uom.symbol })
        .from(uom)
        .where(eq(uom.id, inventoryItems.uomId))})`,
      categoryName: sql<string | null>`(${this.db
        .select({ name: categories.name })
        .from(categories)
        .where(eq(categories.id, inventoryItems.categoryId))})`,
      taxClassName: sql<string | null>`(${this.db
        .select({ name: taxClasses.name })
        .from(taxClasses)
        .where(eq(taxClasses.id, inventoryItems.taxClassId))})`,
    };
  }

  // Every master item with the site's stock levels for it, when set, the stock the site holds of it by location and its
  // stock status; RLS narrows the stock levels and quants to the request's site
  async findForSiteStockTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: SiteStockTableRow[]; count: number }> {
    return this.findAllAndCount<SiteStockTableRow>({
      select: {
        ...this.tableColumns(),
        hasStockLevels: sql<boolean>`${inventoryItemSiteStockLevels.id} IS NOT NULL`,
        reorderPoint: inventoryItemSiteStockLevels.reorderPoint,
        safetyStock: inventoryItemSiteStockLevels.safetyStock,
        maxStockLevel: inventoryItemSiteStockLevels.maxStockLevel,
        onHand: sql<number>`${siteStockOnHand}`.mapWith(Number),
        stockValue: sql<bigint>`${siteStockValue}`.mapWith(BigInt),
        stockStatus: siteStockStatus,
        locations: siteStockLocations,
      },
      leftJoins: [
        {
          table: inventoryItemSiteStockLevels,
          on: eq(inventoryItemSiteStockLevels.inventoryItemId, inventoryItems.id),
        },
        { table: siteStockByItem, on: eq(siteStockByItem.inventoryItemId, inventoryItems.id) },
      ],
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns the UOM symbol for a given UOM ID
  async findUomSymbol(uomId: string): Promise<string | null> {
    const result = await this.db.select({ symbol: uom.symbol }).from(uom).where(eq(uom.id, uomId));
    return result[0]?.symbol ?? null;
  }

  // Returns category name for a given category ID
  async findCategoryName(categoryId: string): Promise<string | null> {
    const result = await this.db
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.id, categoryId));
    return result[0]?.name ?? null;
  }

  async findTaxClassName(taxClassId: string): Promise<string | null> {
    const [row] = await this.db.select({ name: taxClasses.name }).from(taxClasses).where(eq(taxClasses.id, taxClassId));
    return row?.name ?? null;
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

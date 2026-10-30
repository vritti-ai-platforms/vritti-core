import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, getColumns, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import {
  categories,
  type InventoryItem,
  type InventoryItemSite,
  inventoryItemQuants,
  inventoryItemSites,
  inventoryItems,
  inventoryItemUomConversions,
  purchaseOrderItems,
  stockAdjustments,
  stockTransfers,
  supplierItems,
  taxClasses,
  uom,
} from '@/db/schema';

type TableRow = InventoryItem & { uomSymbol: string | null; categoryName: string | null; taxClassName: string | null };

export type SiteInventoryItemRow = TableRow & {
  isEnabled: boolean;
  isStocked: boolean | null;
  reorderPoint: number | null;
  stockedQuantity: string;
};

export type GroupInventoryItemRow = TableRow & { enabledSiteCount: number };

@Injectable()
export class InventoryItemsDomainRepository extends PrimaryBaseRepository<typeof inventoryItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, inventoryItems);
  }

  // Returns paginated inventory item options for select dropdowns.
  override async findForSelect(
    config: FindForSelectConfig,
    options?: { excludeOnSupplierId?: string },
  ): Promise<SelectQueryResult> {
    const conditions: SQL[] = [];

    if (options?.excludeOnSupplierId) {
      conditions.push(sql`EXISTS (
        WITH allowed AS (
          SELECT DISTINCT id AS uom_id FROM (
            SELECT uic.uom_id AS id
            FROM ${inventoryItemUomConversions} uic
            WHERE uic.inventory_item_id = ${inventoryItems.id}
            UNION
            SELECT u.id
            FROM ${uom} u
            WHERE COALESCE(u.base_unit_id, u.id) = (
              SELECT COALESCE(base_unit_id, id) FROM ${uom} WHERE id = ${inventoryItems.uomId}
            )
          ) sub
        )
        SELECT 1 FROM allowed a
        WHERE NOT EXISTS (
          SELECT 1 FROM ${supplierItems} si
          WHERE si.supplier_id = ${options.excludeOnSupplierId}
            AND si.inventory_item_id = ${inventoryItems.id}
            AND si.uom_id = a.uom_id
        )
      )`);
    }

    return super.findForSelect({
      ...config,
      joins: [{ table: uom, on: eq(inventoryItems.uomId, uom.id), type: 'left' }],
      groupTable: config.groupIdKey === 'categoryId' ? categories : undefined,
      conditions,
    });
  }

  // Returns the set of UOM IDs allowed to transact for a given inventory item: - the item's primary UOM - every
  // per-item conversion override - every UOM in the same global "family" (sharing COALESCE(base_unit_id, id) with the
  // primary)
  async findAllowedUomIds(inventoryItemId: string): Promise<string[]> {
    const result = await this.db.execute<{ id: string }>(sql`
      WITH p AS (
        SELECT COALESCE(base_unit_id, id) AS family_root
        FROM ${uom}
        WHERE id = (SELECT uom_id FROM ${inventoryItems} WHERE id = ${inventoryItemId})
      )
      SELECT DISTINCT id FROM (
        SELECT uom_id AS id
        FROM ${inventoryItemUomConversions}
        WHERE inventory_item_id = ${inventoryItemId}
        UNION
        SELECT u.id
        FROM ${uom} u, p
        WHERE COALESCE(u.base_unit_id, u.id) = p.family_root
      ) sub;
    `);
    return ((result as unknown as { rows: { id: string }[] }).rows ?? []).map((r) => r.id);
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
        id: inventoryItems.id,
        organizationId: inventoryItems.organizationId,
        name: inventoryItems.name,
        sku: inventoryItems.sku,
        type: inventoryItems.type,
        tracking: inventoryItems.tracking,
        pickStrategy: inventoryItems.pickStrategy,
        categoryId: inventoryItems.categoryId,
        description: inventoryItems.description,
        uomId: inventoryItems.uomId,
        hsnCode: inventoryItems.hsnCode,
        taxClassId: inventoryItems.taxClassId,
        metadata: inventoryItems.metadata,
        createdAt: inventoryItems.createdAt,
        updatedAt: inventoryItems.updatedAt,
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
      uomSymbol: sql<string | null>`(SELECT u.symbol FROM ${uom} u WHERE u.id = ${inventoryItems.uomId})`,
      categoryName: sql<string | null>`(SELECT c.name FROM ${categories} c WHERE c.id = ${inventoryItems.categoryId})`,
      taxClassName: sql<string | null>`(SELECT t.name FROM ${taxClasses} t WHERE t.id = ${inventoryItems.taxClassId})`,
    };
  }

  // Every master item with this site's enablement row, when it has one, and the stock this site holds of it
  async findForSiteTable(
    siteId: string,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
  ): Promise<{ result: SiteInventoryItemRow[]; count: number }> {
    return this.findAllAndCount<SiteInventoryItemRow>({
      select: {
        ...this.tableColumns(),
        isEnabled: sql<boolean>`${inventoryItemSites.id} IS NOT NULL`,
        isStocked: inventoryItemSites.isStocked,
        reorderPoint: inventoryItemSites.reorderPoint,
        stockedQuantity: sql<string>`CAST(COALESCE((
          SELECT SUM(${inventoryItemQuants.quantity})
          FROM ${inventoryItemQuants}
          WHERE ${inventoryItemQuants.inventoryItemId} = ${inventoryItems.id}
            AND ${inventoryItemQuants.siteId} = ${siteId}
        ), 0) AS TEXT)`,
      },
      leftJoin: {
        table: inventoryItemSites,
        on: and(eq(inventoryItemSites.inventoryItemId, inventoryItems.id), eq(inventoryItemSites.siteId, siteId)),
      },
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Every master item with how many of the group's sites have it enabled
  async findForGroupTable(
    siteIds: string[],
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
  ): Promise<{ result: GroupInventoryItemRow[]; count: number }> {
    const enabledSiteCount =
      siteIds.length > 0
        ? this.db.$count(
            inventoryItemSites,
            and(eq(inventoryItemSites.inventoryItemId, inventoryItems.id), inArray(inventoryItemSites.siteId, siteIds)),
          )
        : sql<number>`0`;

    return this.findAllAndCount<GroupInventoryItemRow>({
      select: { ...this.tableColumns(), enabledSiteCount },
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Item × site availability across the given sites — one projection row per (item, site) that is enabled.
  async findGroupMatrix(siteIds: string[]): Promise<(InventoryItemSite & { itemName: string; itemSku: string })[]> {
    if (siteIds.length === 0) return [];
    return this.db
      .select({
        id: inventoryItemSites.id,
        organizationId: inventoryItemSites.organizationId,
        siteId: inventoryItemSites.siteId,
        inventoryItemId: inventoryItemSites.inventoryItemId,
        isStocked: inventoryItemSites.isStocked,
        reorderPoint: inventoryItemSites.reorderPoint,
        maxStockLevel: inventoryItemSites.maxStockLevel,
        safetyStock: inventoryItemSites.safetyStock,
        createdAt: inventoryItemSites.createdAt,
        updatedAt: inventoryItemSites.updatedAt,
        itemName: inventoryItems.name,
        itemSku: inventoryItems.sku,
      })
      .from(inventoryItemSites)
      .innerJoin(inventoryItems, eq(inventoryItemSites.inventoryItemId, inventoryItems.id))
      .where(inArray(inventoryItemSites.siteId, siteIds));
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

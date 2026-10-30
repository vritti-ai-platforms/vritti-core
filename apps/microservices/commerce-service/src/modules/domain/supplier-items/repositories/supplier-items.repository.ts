import type { SiteTermsRow } from '@domain/suppliers/dto/entity/supplier.dto';
import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, desc, eq, getColumns, inArray, ne, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import {
  categories,
  goodsReceiptItems,
  inventoryItems,
  type NewSupplierItem,
  type NewSupplierItemSite,
  parties,
  purchaseOrderItems,
  type Supplier,
  type SupplierItem,
  type SupplierItemSite,
  supplierItemPrices,
  supplierItemSites,
  supplierItems,
  supplierSites,
  suppliers,
  uom,
} from '@/db/schema';

// A site id as a typed SQL parameter; null yields no site terms (ORG views)
function siteParam(siteId: string | null): SQL {
  return siteId ? sql`${siteId}::uuid` : sql`NULL::uuid`;
}

// Correlated scalar subquery reading one column of a site's price row in force today
function currentPriceColumnSql<T>(column: string, siteId: string | null, map?: (value: unknown) => T): SQL<T | null> {
  const expr = sql<T | null>`(
    SELECT ${sql.raw(`sip.${column}`)} FROM ${supplierItemPrices} sip
    WHERE sip.supplier_item_id = ${supplierItems.id}
      AND sip.site_id = ${siteParam(siteId)}
      AND sip.valid_from <= CURRENT_DATE
      AND (sip.valid_to IS NULL OR sip.valid_to >= CURRENT_DATE)
    ORDER BY sip.valid_from DESC
    LIMIT 1
  )`;
  return map ? expr.mapWith((value: unknown) => (value == null ? null : map(value))) : expr;
}

function currentPriceSql(siteId: string | null): SQL<bigint | null> {
  return currentPriceColumnSql('unit_price', siteId, (value) => BigInt(value as string));
}

// A site's operational settings (joined supplier_item_sites row) and the price row in force there today
function siteTermsSelect(siteId: string | null) {
  return {
    itemSiteId: supplierItemSites.id,
    siteIsPreferred: supplierItemSites.isPreferred,
    siteLeadTimeDays: supplierItemSites.leadTimeDays,
    siteIsLeadTimeOverridden: supplierItemSites.isLeadTimeOverridden,
    currentUnitPrice: currentPriceSql(siteId),
    currentCurrencyCode: currentPriceColumnSql<string>('currency_code', siteId),
    currentSchemeBuyQty: currentPriceColumnSql('scheme_buy_qty', siteId, (value) => Number(value)),
    currentSchemeFreeQty: currentPriceColumnSql('scheme_free_qty', siteId, (value) => Number(value)),
    currentTaxInclusive: currentPriceColumnSql<boolean>('tax_inclusive', siteId),
  };
}

function siteJoin(siteId: string | null): SQL {
  return and(
    eq(supplierItemSites.supplierItemId, supplierItems.id),
    sql`${supplierItemSites.siteId} = ${siteParam(siteId)}`,
  ) as SQL;
}

export type SupplierItemTableRow = SupplierItem & {
  inventoryItemName: string;
  uomSymbol: string;
  siteCount: number;
  preferredSiteCount: number;
};

export type SiteSupplierItemTableRow = SupplierItem & SiteTermsRow & { inventoryItemName: string; uomSymbol: string };

// The supplier's default and accepted currencies come along: an item's prices may be in any of them
type SupplierCurrencies = { supplierCurrencyCode: string; supplierCurrencyCodes: string[] };

// The item's price history, which decides whether it can be deleted and whether its unit can change
type PriceUsage = { priceCount: number; pricedSiteCount: number };

export type SupplierItemDetailRow = SupplierItemTableRow & { supplierCode: string | null } & SupplierCurrencies &
  PriceUsage;

export type SiteSupplierItemDetailRow = SiteSupplierItemTableRow & {
  supplierCode: string | null;
} & SupplierCurrencies &
  PriceUsage;

export type InventoryItemSupplierRow = SupplierItem &
  SiteTermsRow & { supplierName: string; supplierCode: string; uomSymbol: string; siteCount: number };

// How many price rows a supplier item has, and at how many sites
function priceUsageSql() {
  return {
    priceCount: sql<number>`(
      SELECT count(*)::int FROM ${supplierItemPrices} p WHERE p.supplier_item_id = ${supplierItems.id}
    )`.mapWith(Number),
    pricedSiteCount: sql<number>`(
      SELECT count(DISTINCT p.site_id)::int FROM ${supplierItemPrices} p WHERE p.supplier_item_id = ${supplierItems.id}
    )`.mapWith(Number),
  };
}

// Number of sites a supplier item is set up at
function itemSiteCountSql(): SQL<number> {
  return sql<number>`(
    SELECT count(*)::int FROM ${supplierItemSites} sis WHERE sis.supplier_item_id = ${supplierItems.id}
  )`.mapWith(Number);
}

function preferredSiteCountSql(): SQL<number> {
  return sql<number>`(
    SELECT count(*)::int FROM ${supplierItemSites} sis
    WHERE sis.supplier_item_id = ${supplierItems.id} AND sis.is_preferred
  )`.mapWith(Number);
}

@Injectable()
export class SupplierItemsDomainRepository extends PrimaryBaseRepository<typeof supplierItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierItems);
  }

  // Returns paginated supplier item options — one row per (inventoryItem, uom) pair
  override findForSelect(
    config: FindForSelectConfig,
    options?: {
      supplierId?: string;
      siteId?: string | null;
      excludeOnPurchaseOrderId?: string;
      excludeOnGoodsReceiptId?: string;
    },
  ): Promise<SelectQueryResult> {
    const siteId = options?.siteId ?? null;
    const conditions: SQL[] = [];

    // At a site only the items set up and active there; from a legal entity every item of its suppliers
    if (siteId) {
      conditions.push(sql`EXISTS (
        SELECT 1 FROM ${supplierItemSites} sis
        WHERE sis.supplier_item_id = ${supplierItems.id}
          AND sis.site_id = ${siteParam(siteId)}
      )`);
    }

    if (options?.supplierId) {
      conditions.push(eq(supplierItems.supplierId, options.supplierId));
    }

    if (options?.excludeOnPurchaseOrderId) {
      const poId = options.excludeOnPurchaseOrderId;
      conditions.push(sql`NOT EXISTS (
        SELECT 1 FROM ${purchaseOrderItems} poi
        WHERE poi.purchase_order_id = ${poId}
          AND poi.inventory_item_id = ${supplierItems.inventoryItemId}
          AND poi.uom_id = ${supplierItems.uomId}
      )`);
    }

    if (options?.excludeOnGoodsReceiptId) {
      const grId = options.excludeOnGoodsReceiptId;
      conditions.push(sql`NOT EXISTS (
        SELECT 1 FROM ${goodsReceiptItems} gri
        WHERE gri.goods_receipt_id = ${grId}
          AND gri.inventory_item_id = ${supplierItems.inventoryItemId}
          AND gri.uom_id = ${supplierItems.uomId}
      )`);
    }

    return super.findForSelect({
      ...config,
      joins: [
        { table: inventoryItems, on: eq(inventoryItems.id, supplierItems.inventoryItemId), type: 'inner' },
        { table: categories, on: eq(categories.id, inventoryItems.categoryId), type: 'left' },
        { table: uom, on: eq(uom.id, supplierItems.uomId), type: 'left' },
      ],
      groupTable: config.groupIdKey === 'categoryId' ? categories : undefined,
      conditions,
      additionalExpressions: {
        unitPrice: currentPriceSql(siteId),
        currencyCode: currentPriceColumnSql('currency_code', siteId),
        schemeBuyQty: currentPriceColumnSql('scheme_buy_qty', siteId),
        schemeFreeQty: currentPriceColumnSql('scheme_free_qty', siteId),
        hasScheme: sql`(${currentPriceColumnSql('scheme_buy_qty', siteId)} IS NOT NULL AND ${currentPriceColumnSql('scheme_free_qty', siteId)} IS NOT NULL)`,
        taxInclusive: currentPriceColumnSql('tax_inclusive', siteId),
      },
    });
  }

  async findSupplierById(id: string): Promise<Supplier | undefined> {
    const [row] = await this.db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    return row as Supplier | undefined;
  }

  // Returns paginated supplier items for a supplier with item/UOM display fields and how many sites carry each
  async findItemsForTable(
    supplierId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: SupplierItemTableRow[]; count: number }> {
    const baseWhere = eq(supplierItems.supplierId, supplierId);
    return this.findAllAndCount<SupplierItemTableRow>({
      select: {
        ...getColumns(supplierItems),
        inventoryItemName: inventoryItems.name,
        uomSymbol: uom.symbol,
        siteCount: itemSiteCountSql(),
        preferredSiteCount: preferredSiteCountSql(),
      },
      leftJoins: [
        { table: inventoryItems, on: eq(supplierItems.inventoryItemId, inventoryItems.id) },
        { table: uom, on: eq(supplierItems.uomId, uom.id) },
      ],
      where: options.where ? and(baseWhere, options.where) : baseWhere,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(supplierItems.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns paginated supplier items carried by a site, with that site's terms and price in force
  async findSiteItemsForTable(
    supplierId: string,
    siteId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
    { carriedOnly }: { carriedOnly: boolean },
  ): Promise<{ result: SiteSupplierItemTableRow[]; count: number }> {
    const baseWhere = eq(supplierItems.supplierId, supplierId);
    const siteRow = { table: supplierItemSites, on: siteJoin(siteId) };
    return this.findAllAndCount<SiteSupplierItemTableRow>({
      select: {
        ...getColumns(supplierItems),
        inventoryItemName: inventoryItems.name,
        uomSymbol: uom.symbol,
        ...siteTermsSelect(siteId),
      },
      innerJoins: carriedOnly ? [siteRow] : [],
      leftJoins: [
        ...(carriedOnly ? [] : [siteRow]),
        { table: inventoryItems, on: eq(supplierItems.inventoryItemId, inventoryItems.id) },
        { table: uom, on: eq(supplierItems.uomId, uom.id) },
      ],
      where: options.where ? and(baseWhere, options.where) : baseWhere,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(supplierItems.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // current price
  async findSuppliersForItem(
    inventoryItemId: string,
    siteId: string | null,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: InventoryItemSupplierRow[]; count: number }> {
    const baseWhere = eq(supplierItems.inventoryItemId, inventoryItemId);
    return this.findAllAndCount<InventoryItemSupplierRow>({
      select: {
        ...getColumns(supplierItems),
        supplierName: parties.displayName,
        siteCount: itemSiteCountSql(),
        supplierCode: suppliers.code,
        uomSymbol: uom.symbol,
        ...siteTermsSelect(siteId),
      },
      leftJoins: [
        { table: suppliers, on: eq(supplierItems.supplierId, suppliers.id) },
        { table: parties, on: eq(suppliers.partyId, parties.id) },
        { table: uom, on: eq(supplierItems.uomId, uom.id) },
        { table: supplierItemSites, on: siteJoin(siteId) },
      ],
      where: options.where ? and(baseWhere, options.where) : baseWhere,
      orderBy: options.orderBy?.length
        ? options.orderBy
        : [sql`${supplierItemSites.isPreferred} DESC NULLS LAST`, desc(supplierItems.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Stable-ordered page for the mobile Relay suppliers feed: preferred at the site first, then newest, with an id
  // tie-breaker so the total order is deterministic (offset cursors don't skip/duplicate).
  async findSuppliersFeedKeyset(
    siteId: string | null,
    options: { where?: SQL; orderBy: SQL[]; limit: number },
  ): Promise<{ rows: InventoryItemSupplierRow[]; hasMore: boolean }> {
    return this.findKeyset<InventoryItemSupplierRow>({
      select: {
        ...getColumns(supplierItems),
        supplierName: parties.displayName,
        siteCount: itemSiteCountSql(),
        supplierCode: suppliers.code,
        uomSymbol: uom.symbol,
        ...siteTermsSelect(siteId),
      },
      leftJoins: [
        { table: suppliers, on: eq(supplierItems.supplierId, suppliers.id) },
        { table: parties, on: eq(suppliers.partyId, parties.id) },
        { table: uom, on: eq(supplierItems.uomId, uom.id) },
        { table: supplierItemSites, on: siteJoin(siteId) },
      ],
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
    });
  }

  // Creates a supplier item link
  async createSupplierItem(data: NewSupplierItem): Promise<SupplierItem> {
    const [row] = await this.db.insert(supplierItems).values(data).returning();
    return row as SupplierItem;
  }

  // Updates a supplier item link by ID
  async updateSupplierItem(id: string, data: Partial<NewSupplierItem>): Promise<SupplierItem> {
    const [row] = await this.db.update(supplierItems).set(data).where(eq(supplierItems.id, id)).returning();
    return row as SupplierItem;
  }

  // Deletes a supplier item link by ID
  async deleteSupplierItem(id: string): Promise<void> {
    await this.db.delete(supplierItems).where(eq(supplierItems.id, id));
  }

  // Finds a supplier item by ID with inventory item name and UOM symbol
  async findSupplierItemById(
    id: string,
  ): Promise<(SupplierItem & { inventoryItemName: string; uomSymbol: string }) | undefined> {
    const [row] = await this.db
      .select({
        ...getColumns(supplierItems),
        inventoryItemName: inventoryItems.name,
        uomSymbol: uom.symbol,
      })
      .from(supplierItems)
      .leftJoin(inventoryItems, eq(supplierItems.inventoryItemId, inventoryItems.id))
      .leftJoin(uom, eq(supplierItems.uomId, uom.id))
      .where(eq(supplierItems.id, id))
      .limit(1);

    return row as (SupplierItem & { inventoryItemName: string; uomSymbol: string }) | undefined;
  }

  // Finds a supplier item by ID with display joins, supplier identity, and how many sites carry it
  async findItemDetailById(id: string): Promise<SupplierItemDetailRow | undefined> {
    const [row] = await this.db
      .select({
        ...getColumns(supplierItems),
        inventoryItemName: inventoryItems.name,
        uomSymbol: uom.symbol,
        supplierCode: suppliers.code,
        supplierCurrencyCode: suppliers.currencyCode,
        supplierCurrencyCodes: suppliers.currencyCodes,
        ...priceUsageSql(),
        siteCount: itemSiteCountSql(),
        preferredSiteCount: preferredSiteCountSql(),
      })
      .from(supplierItems)
      .leftJoin(inventoryItems, eq(supplierItems.inventoryItemId, inventoryItems.id))
      .leftJoin(uom, eq(supplierItems.uomId, uom.id))
      .leftJoin(suppliers, eq(supplierItems.supplierId, suppliers.id))
      .where(eq(supplierItems.id, id))
      .limit(1);
    return row as SupplierItemDetailRow | undefined;
  }

  // Finds a supplier item as one site sees it — its terms and price in force there, both empty when the site does not
  // carry it
  async findSiteItemDetailById(id: string, siteId: string): Promise<SiteSupplierItemDetailRow | undefined> {
    const [row] = await this.db
      .select({
        ...getColumns(supplierItems),
        inventoryItemName: inventoryItems.name,
        uomSymbol: uom.symbol,
        supplierCode: suppliers.code,
        supplierCurrencyCode: suppliers.currencyCode,
        supplierCurrencyCodes: suppliers.currencyCodes,
        ...priceUsageSql(),
        ...siteTermsSelect(siteId),
      })
      .from(supplierItems)
      .leftJoin(supplierItemSites, siteJoin(siteId))
      .leftJoin(inventoryItems, eq(supplierItems.inventoryItemId, inventoryItems.id))
      .leftJoin(uom, eq(supplierItems.uomId, uom.id))
      .leftJoin(suppliers, eq(supplierItems.supplierId, suppliers.id))
      .where(eq(supplierItems.id, id))
      .limit(1);
    return row as SiteSupplierItemDetailRow | undefined;
  }

  async findItemBySupplierInventoryItemAndUom(
    supplierId: string,
    inventoryItemId: string,
    uomId: string,
  ): Promise<SupplierItem | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierItems)
      .where(
        and(
          eq(supplierItems.supplierId, supplierId),
          eq(supplierItems.inventoryItemId, inventoryItemId),
          eq(supplierItems.uomId, uomId),
        ),
      )
      .limit(1);
    return row as SupplierItem | undefined;
  }

  async findUomSymbol(uomId: string): Promise<string | null> {
    const [row] = await this.db.select({ symbol: uom.symbol }).from(uom).where(eq(uom.id, uomId)).limit(1);
    return row?.symbol ?? null;
  }

  async findEnrolledSiteIds(supplierId: string): Promise<string[]> {
    const rows = await this.db
      .select({ siteId: supplierSites.siteId })
      .from(supplierSites)
      .where(eq(supplierSites.supplierId, supplierId));
    return rows.map((row) => row.siteId);
  }

  // Returns paginated site rows of a supplier item
  findItemSitesForTable(
    supplierItemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: SupplierItemSite[]; count: number }> {
    const scope = eq(supplierItems.id, supplierItemId);
    return this.findAllAndCount<SupplierItemSite>({
      select: getColumns(supplierItemSites),
      innerJoin: { table: supplierItemSites, on: eq(supplierItemSites.supplierItemId, supplierItems.id) },
      where: options.where ? and(scope, options.where) : scope,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(supplierItemSites.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  async findItemSite(supplierItemId: string, siteId: string): Promise<SupplierItemSite | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierItemSites)
      .where(and(eq(supplierItemSites.supplierItemId, supplierItemId), eq(supplierItemSites.siteId, siteId)))
      .limit(1);
    return row as SupplierItemSite | undefined;
  }

  async findItemSiteIds(supplierItemId: string): Promise<string[]> {
    const rows = await this.db
      .select({ siteId: supplierItemSites.siteId })
      .from(supplierItemSites)
      .where(eq(supplierItemSites.supplierItemId, supplierItemId));
    return rows.map((row) => row.siteId);
  }

  async findItemSitesFor(supplierItemIds: string[], siteIds: string[]): Promise<SupplierItemSite[]> {
    if (supplierItemIds.length === 0 || siteIds.length === 0) return [];
    const rows = await this.db
      .select()
      .from(supplierItemSites)
      .where(
        and(inArray(supplierItemSites.supplierItemId, supplierItemIds), inArray(supplierItemSites.siteId, siteIds)),
      );
    return rows as SupplierItemSite[];
  }

  async insertItemSites(rows: Omit<NewSupplierItemSite, 'organizationId'>[]): Promise<SupplierItemSite[]> {
    if (rows.length === 0) return [];
    return (await this.db.insert(supplierItemSites).values(rows).returning()) as SupplierItemSite[];
  }

  // How many price rows the supplier items have, and at how many sites — any price history blocks deleting them
  async countPrices(supplierItemIds: string[]): Promise<{ prices: number; sites: number }> {
    const [row] = await this.db
      .select({
        prices: sql<number>`count(*)::int`.mapWith(Number),
        sites: sql<number>`count(distinct ${supplierItemPrices.siteId})::int`.mapWith(Number),
      })
      .from(supplierItemPrices)
      .where(inArray(supplierItemPrices.supplierItemId, supplierItemIds));
    return { prices: row?.prices ?? 0, sites: row?.sites ?? 0 };
  }

  // Sets a supplier item's lead time on every site still following it; returns how many took it
  async applyLeadTimeToSites(supplierItemIds: string[], leadTimeDays: number | null): Promise<number> {
    if (supplierItemIds.length === 0) return 0;
    const rows = await this.db
      .update(supplierItemSites)
      .set({ leadTimeDays })
      .where(
        and(
          inArray(supplierItemSites.supplierItemId, supplierItemIds),
          eq(supplierItemSites.isLeadTimeOverridden, false),
        ),
      )
      .returning({ id: supplierItemSites.id });
    return rows.length;
  }

  // Updates the supplier's items among the given ids; returns the ids updated
  async bulkUpdateSupplierItems(
    supplierId: string,
    ids: string[],
    data: Pick<Partial<NewSupplierItem>, 'minOrderQuantity' | 'leadTimeDays'>,
  ): Promise<string[]> {
    const rows = await this.db
      .update(supplierItems)
      .set(data)
      .where(and(eq(supplierItems.supplierId, supplierId), inArray(supplierItems.id, ids)))
      .returning({ id: supplierItems.id });
    return rows.map((row) => row.id);
  }

  // Clears the preferred flag of every other supplier for an inventory item at a site
  async clearPreferredAtSite(inventoryItemId: string, siteId: string, exceptItemSiteId: string): Promise<void> {
    await this.db
      .update(supplierItemSites)
      .set({ isPreferred: false })
      .where(
        and(
          eq(supplierItemSites.inventoryItemId, inventoryItemId),
          eq(supplierItemSites.siteId, siteId),
          eq(supplierItemSites.isPreferred, true),
          ne(supplierItemSites.id, exceptItemSiteId),
        ),
      );
  }

  // Loads a site row by id
  async findItemSiteById(id: string): Promise<SupplierItemSite | undefined> {
    const [row] = await this.db.select().from(supplierItemSites).where(eq(supplierItemSites.id, id)).limit(1);
    return row as SupplierItemSite | undefined;
  }

  // Updates a site row by id
  async updateItemSite(id: string, data: Partial<NewSupplierItemSite>): Promise<void> {
    await this.db.update(supplierItemSites).set(data).where(eq(supplierItemSites.id, id));
  }

  // Deletes a site row by id
  async deleteItemSite(id: string): Promise<void> {
    await this.db.delete(supplierItemSites).where(eq(supplierItemSites.id, id));
  }
}

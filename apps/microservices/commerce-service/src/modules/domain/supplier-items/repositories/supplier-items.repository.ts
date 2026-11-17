import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import {
  and,
  asc,
  desc,
  eq,
  getColumns,
  gte,
  inArray,
  isNull,
  lte,
  ne,
  or,
  type SQL,
  sql,
} from '@vritti/api-sdk/drizzle-orm';
import { alias, QueryBuilder } from '@vritti/api-sdk/drizzle-pg-core';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import {
  categories,
  currentSiteId,
  goodsReceiptItems,
  inventoryItems,
  type NewSupplierItem,
  type NewSupplierSiteItem,
  parties,
  purchaseOrderItems,
  purchaseOrders,
  type Supplier,
  type SupplierItem,
  type SupplierSiteItem,
  supplierEnrollments,
  supplierItemPrices,
  supplierItems,
  supplierSiteItems,
  suppliers,
  uom,
} from '@/db/schema';
import type { SupplierSiteItemTermsRow } from '../dto/entity/supplier-site-item-terms.dto';

// A site id as a typed SQL parameter: the named site, the request's site when undefined, none for null (LE and ORG views)
function siteParam(siteId: string | null | undefined): SQL {
  return siteId === null ? sql`NULL::uuid` : sql`${siteId ?? currentSiteId()}::uuid`;
}

interface PriceLookup<T> {
  map?: (value: unknown) => T;
  asOf?: string | null;
  currency?: string | null;
}

const priceRows = alias(supplierItemPrices, 'price_rows');

type PriceColumn = 'unitPrice' | 'currencyCode' | 'schemeBuyQty' | 'schemeFreeQty' | 'taxInclusive';

// Correlated scalar subquery reading one column of the price row a site pays: its own in force, else its legal entity's
function currentPriceColumnSql<T>(
  column: PriceColumn,
  siteId: string | null | undefined,
  { map, asOf, currency }: PriceLookup<T> = {},
): SQL<T | null> {
  const day = asOf ? sql`${asOf}::date` : sql`CURRENT_DATE`;
  const row = new QueryBuilder()
    .select({ value: priceRows[column] })
    .from(priceRows)
    .where(
      and(
        eq(priceRows.supplierItemId, supplierItems.id),
        // A site pays its own price in force, else the legal entity's; with no site only the legal entity's applies
        siteId === null
          ? isNull(priceRows.siteId)
          : or(eq(priceRows.siteId, siteId ?? currentSiteId()), isNull(priceRows.siteId)),
        lte(priceRows.validFrom, day),
        or(isNull(priceRows.validTo), gte(priceRows.validTo, day)),
        currency ? eq(priceRows.currencyCode, currency) : undefined,
      ),
    )
    .orderBy(isNull(priceRows.siteId), desc(priceRows.validFrom))
    .limit(1);
  const expr = sql<T | null>`(${row})`;
  return map ? expr.mapWith((value: unknown) => (value == null ? null : map(value))) : expr;
}

function currentPriceSql(
  siteId: string | null | undefined,
  lookup: Omit<PriceLookup<bigint>, 'map'> = {},
): SQL<bigint | null> {
  return currentPriceColumnSql('unitPrice', siteId, { ...lookup, map: (value) => BigInt(value as string) });
}

// A site's operational settings (joined supplier_site_items row) and the price row in force there today
function siteItemTermsSelect(siteId: string | null | undefined) {
  return {
    supplierSiteItemId: supplierSiteItems.id,
    siteIsPreferred: supplierSiteItems.isPreferred,
    siteLeadTimeDays: supplierSiteItems.leadTimeDays,
    siteIsLeadTimeOverridden: supplierSiteItems.isLeadTimeOverridden,
    currentUnitPrice: currentPriceSql(siteId),
    currentCurrencyCode: currentPriceColumnSql<string>('currencyCode', siteId),
    currentSchemeBuyQty: currentPriceColumnSql('schemeBuyQty', siteId, { map: (value) => Number(value) }),
    currentSchemeFreeQty: currentPriceColumnSql('schemeFreeQty', siteId, { map: (value) => Number(value) }),
    currentTaxInclusive: currentPriceColumnSql<boolean>('taxInclusive', siteId),
  };
}

// Joins the supplier item's supplier_site_items row at one site
function siteItemJoin(siteId: string | null | undefined): SQL {
  return and(
    eq(supplierSiteItems.supplierItemId, supplierItems.id),
    sql`${supplierSiteItems.siteId} = ${siteParam(siteId)}`,
  ) as SQL;
}

export type SupplierItemTableRow = SupplierItem & {
  inventoryItemName: string;
  uomSymbol: string;
  siteCount: number;
  preferredSiteCount: number;
};

export type SupplierSiteItemTableRow = SupplierItem &
  SupplierSiteItemTermsRow & { inventoryItemName: string; uomSymbol: string };

// The supplier's default and accepted currencies come along: an item's prices may be in any of them
type SupplierCurrencies = { supplierCurrencyCode: string; supplierCurrencyCodes: string[] };

// The item's price history, which decides whether it can be deleted and whether its unit can change
type PriceUsage = { priceCount: number; pricedSiteCount: number };

export type SupplierItemDetailRow = SupplierItemTableRow & { supplierCode: string | null } & SupplierCurrencies &
  PriceUsage;

export type SupplierSiteItemDetailRow = SupplierSiteItemTableRow & {
  supplierCode: string | null;
} & SupplierCurrencies &
  PriceUsage;

export type InventoryItemSupplierRow = SupplierItem &
  SupplierSiteItemTermsRow & { supplierName: string; supplierCode: string; uomSymbol: string; siteCount: number };

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
function siteItemCountSql(): SQL<number> {
  return sql<number>`(
    SELECT count(*)::int FROM ${supplierSiteItems} ssi WHERE ssi.supplier_item_id = ${supplierItems.id}
  )`.mapWith(Number);
}

function preferredSiteCountSql(): SQL<number> {
  return sql<number>`(
    SELECT count(*)::int FROM ${supplierSiteItems} ssi
    WHERE ssi.supplier_item_id = ${supplierItems.id} AND ssi.is_preferred
  )`.mapWith(Number);
}

@Injectable()
export class SupplierItemsDomainRepository extends PrimaryBaseRepository<typeof supplierItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierItems);
  }

  // Returns paginated supplier item options — one row per (inventoryItem, uom) pair
  override async findForSelect(
    config: FindForSelectConfig,
    options?: {
      supplierId?: string;
      siteId?: string | null;
      purchaseOrderId?: string;
      excludeOnGoodsReceiptId?: string;
    },
  ): Promise<SelectQueryResult> {
    // An order's items come from its site, priced as of its order date in its currency (none when the item has no price
    // in it), whichever workspace raises it
    const [purchaseOrder] = options?.purchaseOrderId
      ? await this.db
          .select({
            siteId: purchaseOrders.siteId,
            orderDate: purchaseOrders.orderDate,
            currencyCode: purchaseOrders.currencyCode,
          })
          .from(purchaseOrders)
          .where(eq(purchaseOrders.id, options.purchaseOrderId))
      : [];
    const siteId = purchaseOrder?.siteId ?? options?.siteId;
    const lookup = { asOf: purchaseOrder?.orderDate, currency: purchaseOrder?.currencyCode };
    const conditions: SQL[] = [];

    // At a site — the order's, the named one, else the request's when it is a site workspace — only the items set up
    // there; otherwise every item of its suppliers
    if (siteId !== null) {
      const setUpAtSite = sql`EXISTS (
        SELECT 1 FROM ${supplierSiteItems} ssi
        WHERE ssi.supplier_item_id = ${supplierItems.id}
          AND ssi.site_id = ${siteParam(siteId)}
      )`;
      conditions.push(siteId ? setUpAtSite : sql`(${currentSiteId()} is null or ${setUpAtSite})`);
    }

    if (options?.supplierId) {
      conditions.push(eq(supplierItems.supplierId, options.supplierId));
    }

    if (options?.purchaseOrderId) {
      const poId = options.purchaseOrderId;
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
        { table: uom, on: eq(uom.id, supplierItems.uomId), type: 'inner' },
      ],
      groupTable: config.groupIdKey === 'categoryId' ? categories : undefined,
      conditions,
      additionalExpressions: {
        unitPrice: currentPriceSql(siteId, lookup),
        currencyCode: currentPriceColumnSql('currencyCode', siteId, lookup),
        schemeBuyQty: currentPriceColumnSql('schemeBuyQty', siteId, lookup),
        schemeFreeQty: currentPriceColumnSql('schemeFreeQty', siteId, lookup),
        hasScheme: sql`(${currentPriceColumnSql('schemeBuyQty', siteId, lookup)} IS NOT NULL AND ${currentPriceColumnSql('schemeFreeQty', siteId, lookup)} IS NOT NULL)`,
        taxInclusive: currentPriceColumnSql('taxInclusive', siteId, lookup),
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
        siteCount: siteItemCountSql(),
        preferredSiteCount: preferredSiteCountSql(),
      },
      innerJoins: [
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
  async findSiteItemsAtSiteForTable(
    supplierId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
    { carriedOnly }: { carriedOnly: boolean },
    siteId?: string,
  ): Promise<{ result: SupplierSiteItemTableRow[]; count: number }> {
    const baseWhere = eq(supplierItems.supplierId, supplierId);
    const siteItemRow = { table: supplierSiteItems, on: siteItemJoin(siteId) };
    return this.findAllAndCount<SupplierSiteItemTableRow>({
      select: {
        ...getColumns(supplierItems),
        inventoryItemName: inventoryItems.name,
        uomSymbol: uom.symbol,
        ...siteItemTermsSelect(siteId),
      },
      innerJoins: [
        ...(carriedOnly ? [siteItemRow] : []),
        { table: inventoryItems, on: eq(supplierItems.inventoryItemId, inventoryItems.id) },
        { table: uom, on: eq(supplierItems.uomId, uom.id) },
      ],
      leftJoins: carriedOnly ? [] : [siteItemRow],
      where: options.where ? and(baseWhere, options.where) : baseWhere,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(supplierItems.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // current price
  async findSuppliersForItem(
    inventoryItemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
    siteId?: string | null,
  ): Promise<{ result: InventoryItemSupplierRow[]; count: number }> {
    const baseWhere = eq(supplierItems.inventoryItemId, inventoryItemId);
    return this.findAllAndCount<InventoryItemSupplierRow>({
      select: {
        ...getColumns(supplierItems),
        supplierName: parties.displayName,
        siteCount: siteItemCountSql(),
        supplierCode: suppliers.code,
        uomSymbol: uom.symbol,
        ...siteItemTermsSelect(siteId),
      },
      innerJoins: [{ table: uom, on: eq(supplierItems.uomId, uom.id) }],
      leftJoins: [
        { table: suppliers, on: eq(supplierItems.supplierId, suppliers.id) },
        { table: parties, on: eq(suppliers.partyId, parties.id) },
        { table: supplierSiteItems, on: siteItemJoin(siteId) },
      ],
      where: options.where ? and(baseWhere, options.where) : baseWhere,
      orderBy: options.orderBy?.length
        ? options.orderBy
        : [sql`${supplierSiteItems.isPreferred} DESC NULLS LAST`, desc(supplierItems.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Stable-ordered page for the mobile Relay suppliers feed: preferred at the site first, then newest, with an id
  // tie-breaker so the total order is deterministic (offset cursors don't skip/duplicate).
  async findSuppliersFeedKeyset(
    options: { where?: SQL; orderBy: SQL[]; limit: number },
    siteId?: string | null,
  ): Promise<{ rows: InventoryItemSupplierRow[]; hasMore: boolean }> {
    return this.findKeyset<InventoryItemSupplierRow>({
      select: {
        ...getColumns(supplierItems),
        supplierName: parties.displayName,
        siteCount: siteItemCountSql(),
        supplierCode: suppliers.code,
        uomSymbol: uom.symbol,
        ...siteItemTermsSelect(siteId),
      },
      leftJoins: [
        { table: suppliers, on: eq(supplierItems.supplierId, suppliers.id) },
        { table: parties, on: eq(suppliers.partyId, parties.id) },
        { table: uom, on: eq(supplierItems.uomId, uom.id) },
        { table: supplierSiteItems, on: siteItemJoin(siteId) },
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
      .innerJoin(inventoryItems, eq(supplierItems.inventoryItemId, inventoryItems.id))
      .innerJoin(uom, eq(supplierItems.uomId, uom.id))
      .where(eq(supplierItems.id, id))
      .limit(1);

    return row;
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
        siteCount: siteItemCountSql(),
        preferredSiteCount: preferredSiteCountSql(),
      })
      .from(supplierItems)
      .innerJoin(inventoryItems, eq(supplierItems.inventoryItemId, inventoryItems.id))
      .innerJoin(uom, eq(supplierItems.uomId, uom.id))
      .innerJoin(suppliers, eq(supplierItems.supplierId, suppliers.id))
      .where(eq(supplierItems.id, id))
      .limit(1);
    return row as SupplierItemDetailRow | undefined;
  }

  // Finds a supplier item as one site sees it — its terms and price in force there, both empty when the site does not
  // carry it
  async findSiteItemDetailById(id: string, siteId?: string): Promise<SupplierSiteItemDetailRow | undefined> {
    const [row] = await this.db
      .select({
        ...getColumns(supplierItems),
        inventoryItemName: inventoryItems.name,
        uomSymbol: uom.symbol,
        supplierCode: suppliers.code,
        supplierCurrencyCode: suppliers.currencyCode,
        supplierCurrencyCodes: suppliers.currencyCodes,
        ...priceUsageSql(),
        ...siteItemTermsSelect(siteId),
      })
      .from(supplierItems)
      .leftJoin(supplierSiteItems, siteItemJoin(siteId))
      .innerJoin(inventoryItems, eq(supplierItems.inventoryItemId, inventoryItems.id))
      .innerJoin(uom, eq(supplierItems.uomId, uom.id))
      .innerJoin(suppliers, eq(supplierItems.supplierId, suppliers.id))
      .where(eq(supplierItems.id, id))
      .limit(1);
    return row as SupplierSiteItemDetailRow | undefined;
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

  // Rejects a fractional minimum order for a unit that is only sold whole
  async assertMinOrderFitsUnit(uomId: string, minOrderQuantity: number | null | undefined): Promise<void> {
    if (minOrderQuantity == null || Number.isInteger(minOrderQuantity)) return;
    const [unit] = await this.db
      .select({ symbol: uom.symbol, allowDecimal: uom.allowDecimal })
      .from(uom)
      .where(eq(uom.id, uomId))
      .limit(1);
    if (!unit || unit.allowDecimal) return;
    throw new BadRequestException({
      label: 'Whole Units Only',
      detail: `${unit.symbol} is sold in whole units, so the minimum order must be a whole number.`,
      errors: [{ field: 'minOrderQuantity', message: `Whole ${unit.symbol} only` }],
    });
  }

  // Rejects a fractional minimum order when any of the supplier items is sold in a whole-only unit
  async assertMinOrderFitsUnits(supplierItemIds: string[], minOrderQuantity: number | null | undefined): Promise<void> {
    if (minOrderQuantity == null || Number.isInteger(minOrderQuantity)) return;
    const rows = await this.db
      .selectDistinct({ symbol: uom.symbol })
      .from(supplierItems)
      .innerJoin(uom, eq(supplierItems.uomId, uom.id))
      .where(and(inArray(supplierItems.id, supplierItemIds), eq(uom.allowDecimal, false)));
    if (rows.length === 0) return;
    const symbols = rows.map((row) => row.symbol).join(', ');
    throw new BadRequestException({
      label: 'Whole Units Only',
      detail: `Some selected items are sold in whole units (${symbols}), so the minimum order must be a whole number.`,
      errors: [{ field: 'minOrderQuantity', message: `Whole ${symbols} only` }],
    });
  }

  async findUomSymbol(uomId: string): Promise<string> {
    const [row] = await this.db.select({ symbol: uom.symbol }).from(uom).where(eq(uom.id, uomId)).limit(1);
    return row.symbol;
  }

  // Returns true when the supplier is enrolled at the named site, else at the request's site
  async isEnrolledAt(supplierId: string, siteId?: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: supplierEnrollments.id })
      .from(supplierEnrollments)
      .where(
        and(eq(supplierEnrollments.supplierId, supplierId), eq(supplierEnrollments.siteId, siteId ?? currentSiteId())),
      )
      .limit(1);
    return rows.length > 0;
  }

  async findEnrolledSiteIds(supplierId: string): Promise<string[]> {
    const rows = await this.db
      .select({ siteId: supplierEnrollments.siteId })
      .from(supplierEnrollments)
      .where(eq(supplierEnrollments.supplierId, supplierId));
    return rows.map((row) => row.siteId);
  }

  // Returns the paginated site items of a supplier item
  findSiteItemsForTable(
    supplierItemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: SupplierSiteItem[]; count: number }> {
    const scope = eq(supplierItems.id, supplierItemId);
    return this.findAllAndCount<SupplierSiteItem>({
      select: getColumns(supplierSiteItems),
      innerJoin: { table: supplierSiteItems, on: eq(supplierSiteItems.supplierItemId, supplierItems.id) },
      where: options.where ? and(scope, options.where) : scope,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(supplierSiteItems.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns the unit the supplier sells each of the items in at the site — the preferred site item's, else the first set
  // up there, else the first of its supplier items — one row per item the supplier has
  findSiteUnits(
    supplierId: string,
    siteId: string,
    inventoryItemIds: string[],
  ): Promise<{ inventoryItemId: string; uomId: string }[]> {
    return this.db
      .selectDistinctOn([supplierItems.inventoryItemId], {
        inventoryItemId: supplierItems.inventoryItemId,
        uomId: supplierItems.uomId,
      })
      .from(supplierItems)
      .leftJoin(supplierSiteItems, this.siteItemAt(siteId))
      .where(and(eq(supplierItems.supplierId, supplierId), inArray(supplierItems.inventoryItemId, inventoryItemIds)))
      .orderBy(supplierItems.inventoryItemId, ...this.siteItemsFirst());
  }

  // Returns the lead time at the site of every unit the supplier sells each of the items in — the site item's, else the
  // supplier item's default — site items first, preferred first
  findSiteLeadTimes(
    supplierId: string,
    siteId: string,
    inventoryItemIds: string[],
  ): Promise<{ inventoryItemId: string; uomId: string; leadTimeDays: number }[]> {
    return this.db
      .select({
        inventoryItemId: supplierItems.inventoryItemId,
        uomId: supplierItems.uomId,
        leadTimeDays:
          sql<number>`coalesce(${supplierSiteItems.leadTimeDays}, ${supplierItems.defaultLeadTimeDays})`.mapWith(
            Number,
          ),
      })
      .from(supplierItems)
      .leftJoin(supplierSiteItems, this.siteItemAt(siteId))
      .where(and(eq(supplierItems.supplierId, supplierId), inArray(supplierItems.inventoryItemId, inventoryItemIds)))
      .orderBy(...this.siteItemsFirst());
  }

  // Returns the item and unit of each of the supplier's items among the given inventory items
  findSetUpKeys(supplierId: string, inventoryItemIds: string[]): Promise<{ inventoryItemId: string; uomId: string }[]> {
    return this.findAllWithSelect<{ inventoryItemId: string; uomId: string }>({
      select: { inventoryItemId: supplierItems.inventoryItemId, uomId: supplierItems.uomId },
      where: and(eq(supplierItems.supplierId, supplierId), inArray(supplierItems.inventoryItemId, inventoryItemIds)),
    });
  }

  // Returns the sites a supplier item is set up at
  async findCarriedSiteIds(supplierItemId: string): Promise<string[]> {
    const rows = await this.db
      .select({ siteId: supplierSiteItems.siteId })
      .from(supplierSiteItems)
      .where(eq(supplierSiteItems.supplierItemId, supplierItemId));
    return rows.map((row) => row.siteId);
  }

  // Finds a supplier item's site item at one site
  async findSiteItem(supplierItemId: string, siteId: string): Promise<SupplierSiteItem | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierSiteItems)
      .where(and(eq(supplierSiteItems.supplierItemId, supplierItemId), eq(supplierSiteItems.siteId, siteId)))
      .limit(1);
    return row as SupplierSiteItem | undefined;
  }

  // Returns the sites a supplier item is set up at
  async findSiteIdsOfItem(supplierItemId: string): Promise<string[]> {
    const rows = await this.db
      .select({ siteId: supplierSiteItems.siteId })
      .from(supplierSiteItems)
      .where(eq(supplierSiteItems.supplierItemId, supplierItemId));
    return rows.map((row) => row.siteId);
  }

  // Finds the site items of the given supplier items at the given sites
  async findSiteItemsFor(supplierItemIds: string[], siteIds: string[]): Promise<SupplierSiteItem[]> {
    if (supplierItemIds.length === 0 || siteIds.length === 0) return [];
    const rows = await this.db
      .select()
      .from(supplierSiteItems)
      .where(
        and(inArray(supplierSiteItems.supplierItemId, supplierItemIds), inArray(supplierSiteItems.siteId, siteIds)),
      );
    return rows as SupplierSiteItem[];
  }

  // Inserts site items
  async insertSiteItems(rows: Omit<NewSupplierSiteItem, 'organizationId'>[]): Promise<SupplierSiteItem[]> {
    if (rows.length === 0) return [];
    return (await this.db.insert(supplierSiteItems).values(rows).returning()) as SupplierSiteItem[];
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

  // Sets a supplier item's default lead time on every site item still following it; returns how many took it
  async applyDefaultLeadTimeToSiteItems(supplierItemIds: string[], defaultLeadTimeDays: number): Promise<number> {
    if (supplierItemIds.length === 0) return 0;
    const rows = await this.db
      .update(supplierSiteItems)
      .set({ leadTimeDays: defaultLeadTimeDays })
      .where(
        and(
          inArray(supplierSiteItems.supplierItemId, supplierItemIds),
          eq(supplierSiteItems.isLeadTimeOverridden, false),
        ),
      )
      .returning({ id: supplierSiteItems.id });
    return rows.length;
  }

  // Updates the supplier's items among the given ids; returns the ids updated
  async bulkUpdateSupplierItems(
    supplierId: string,
    ids: string[],
    data: Pick<Partial<NewSupplierItem>, 'minOrderQuantity' | 'defaultLeadTimeDays'>,
  ): Promise<string[]> {
    const rows = await this.db
      .update(supplierItems)
      .set(data)
      .where(and(eq(supplierItems.supplierId, supplierId), inArray(supplierItems.id, ids)))
      .returning({ id: supplierItems.id });
    return rows.map((row) => row.id);
  }

  // Clears the preferred flag of every other supplier for an inventory item at a site
  async clearPreferredAtSite(inventoryItemId: string, siteId: string, exceptSupplierSiteItemId: string): Promise<void> {
    await this.db
      .update(supplierSiteItems)
      .set({ isPreferred: false })
      .where(
        and(
          eq(supplierSiteItems.inventoryItemId, inventoryItemId),
          eq(supplierSiteItems.siteId, siteId),
          eq(supplierSiteItems.isPreferred, true),
          ne(supplierSiteItems.id, exceptSupplierSiteItemId),
        ),
      );
  }

  // Finds a site item by id
  async findSiteItemById(id: string): Promise<SupplierSiteItem | undefined> {
    const [row] = await this.db.select().from(supplierSiteItems).where(eq(supplierSiteItems.id, id)).limit(1);
    return row as SupplierSiteItem | undefined;
  }

  // Updates a site item by id
  async updateSiteItem(id: string, data: Partial<NewSupplierSiteItem>): Promise<void> {
    await this.db.update(supplierSiteItems).set(data).where(eq(supplierSiteItems.id, id));
  }

  // Deletes a site item by id
  async deleteSiteItem(id: string): Promise<void> {
    await this.db.delete(supplierSiteItems).where(eq(supplierSiteItems.id, id));
  }

  // Joins a supplier item to its setup at the site, if any
  private siteItemAt(siteId: string): SQL {
    return and(eq(supplierSiteItems.supplierItemId, supplierItems.id), eq(supplierSiteItems.siteId, siteId)) as SQL;
  }

  // Orders a supplier item's rows by its setup at the site: set up first, preferred first, then the oldest
  private siteItemsFirst(): SQL[] {
    return [sql`${supplierSiteItems.id} is null`, desc(supplierSiteItems.isPreferred), asc(supplierItems.createdAt)];
  }
}

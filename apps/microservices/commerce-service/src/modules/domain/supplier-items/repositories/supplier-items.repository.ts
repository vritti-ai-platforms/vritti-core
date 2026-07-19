import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  inArray,
  ne,
  notInArray,
  type SQL,
  sql,
} from '@vritti/api-sdk/drizzle-orm';
import {
  categories,
  goodsReceiptItems,
  inventoryItems,
  type NewSupplierItem,
  type NewSupplierItemPrice,
  type NewSupplierItemSite,
  parties,
  purchaseOrderItems,
  type Supplier,
  type SupplierItem,
  type SupplierItemPrice,
  type SupplierItemSite,
  supplierItemPrices,
  supplierItemSites,
  supplierItems,
  suppliers,
  uom,
} from '@/db/schema';

// Correlated scalar subquery resolving the price effective today for the outer supplier_items row.
// Site rows win over general rows (A017 → A018); the session site GUC scopes site rows — LE context
// (GUC unset) naturally reduces to general rows.
export function currentPriceSql(): SQL<bigint | null> {
  return sql<bigint | null>`(
    SELECT sip.unit_price FROM ${supplierItemPrices} sip
    WHERE sip.supplier_item_id = ${supplierItems.id}
      AND sip.valid_from <= CURRENT_DATE
      AND (sip.valid_to IS NULL OR sip.valid_to >= CURRENT_DATE)
      AND (sip.site_id IS NULL OR sip.site_id = current_setting('app.site_id', true)::uuid)
    ORDER BY (sip.site_id IS NULL) ASC, sip.valid_from DESC
    LIMIT 1
  )`.mapWith((value: unknown) => (value == null ? null : BigInt(value as string)));
}

// Matches rows of the same price stratum as the session context — the site GUC when set, else general (NULL)
function gucStratumSql(): SQL {
  return sql`${supplierItemPrices.siteId} IS NOT DISTINCT FROM current_setting('app.site_id', true)::uuid`;
}

// Matches rows of the same price stratum as a fetched row's own site
function rowStratumSql(siteId: string | null): SQL {
  return sql`${supplierItemPrices.siteId} IS NOT DISTINCT FROM ${siteId}::uuid`;
}

@Injectable()
export class SupplierItemsDomainRepository extends PrimaryBaseRepository<typeof supplierItems> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierItems);
  }

  // Returns paginated supplier item options — one row per (inventoryItem, uom) pair.
  // Identity is `supplier_items.id`; inventory item's name = label; tracking = description.
  // Filters out inactive supplier items; optional supplier scope; optional NOT-EXISTS on PO/GR
  // lines to hide combinations already on the target. Composes via super.findForSelect so the
  // base bigint-string serialization, additionalKeys resolution, and pagination logic apply.
  override findForSelect(
    config: FindForSelectConfig,
    options?: {
      supplierId?: string;
      excludeOnPurchaseOrderId?: string;
      excludeOnGoodsReceiptId?: string;
    },
  ): Promise<SelectQueryResult> {
    const conditions: SQL[] = [eq(supplierItems.isActive, true)];

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
        unitPrice: currentPriceSql(),
        schemeBuyQty: sql`${supplierItems.schemeBuyQty}`,
        schemeFreeQty: sql`${supplierItems.schemeFreeQty}`,
        hasScheme: sql`${supplierItems.hasScheme}`,
      },
    });
  }

  async findSupplierById(id: string): Promise<Supplier | undefined> {
    const [row] = await this.db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    return row as Supplier | undefined;
  }

  // Returns paginated supplier items for a supplier with joined item/UOM display fields and the resolved current price
  async findItemsForTable(
    supplierId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{
    result: (SupplierItem & { inventoryItemName: string; uomSymbol: string; currentUnitPrice: bigint | null })[];
    count: number;
  }> {
    const baseWhere = eq(supplierItems.supplierId, supplierId);
    const where = options.where ? and(baseWhere, options.where) : baseWhere;
    return this.findAllAndCount<
      SupplierItem & { inventoryItemName: string; uomSymbol: string; currentUnitPrice: bigint | null }
    >({
      select: {
        ...getTableColumns(supplierItems),
        inventoryItemName: inventoryItems.name,
        uomSymbol: uom.symbol,
        currentUnitPrice: currentPriceSql(),
      },
      leftJoins: [
        { table: inventoryItems, on: eq(supplierItems.inventoryItemId, inventoryItems.id) },
        { table: uom, on: eq(supplierItems.uomId, uom.id) },
      ],
      where,
      orderBy: options.orderBy?.length ? options.orderBy : [desc(supplierItems.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns paginated supplier items for an inventory item with joined supplier name/code, UOM symbol, and current price
  async findSuppliersForItem(
    inventoryItemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{
    result: (SupplierItem & {
      supplierName: string;
      supplierCode: string;
      uomSymbol: string;
      currentUnitPrice: bigint | null;
    })[];
    count: number;
  }> {
    const baseWhere = eq(supplierItems.inventoryItemId, inventoryItemId);
    const where = options.where ? and(baseWhere, options.where) : baseWhere;
    return this.findAllAndCount<
      SupplierItem & { supplierName: string; supplierCode: string; uomSymbol: string; currentUnitPrice: bigint | null }
    >({
      select: {
        ...getTableColumns(supplierItems),
        supplierName: parties.displayName,
        supplierCode: suppliers.code,
        uomSymbol: uom.symbol,
        currentUnitPrice: currentPriceSql(),
      },
      leftJoins: [
        { table: suppliers, on: eq(supplierItems.supplierId, suppliers.id) },
        { table: parties, on: eq(suppliers.partyId, parties.id) },
        { table: uom, on: eq(supplierItems.uomId, uom.id) },
      ],
      where,
      orderBy: options.orderBy?.length
        ? options.orderBy
        : [desc(supplierItems.isPreferred), desc(supplierItems.createdAt)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Stable-ordered page for the mobile Relay suppliers feed: preferred first, then newest, with an id
  // tie-breaker so the total order is deterministic (offset cursors don't skip/duplicate). Reuses the same
  // select + count as findSuppliersForItem.
  async findSuppliersFeedKeyset(options: { where?: SQL; orderBy: SQL[]; limit: number }): Promise<{
    rows: (SupplierItem & {
      supplierName: string;
      supplierCode: string;
      uomSymbol: string;
      currentUnitPrice: bigint | null;
    })[];
    hasMore: boolean;
  }> {
    return this.findKeyset<
      SupplierItem & { supplierName: string; supplierCode: string; uomSymbol: string; currentUnitPrice: bigint | null }
    >({
      select: {
        ...getTableColumns(supplierItems),
        supplierName: parties.displayName,
        supplierCode: suppliers.code,
        uomSymbol: uom.symbol,
        currentUnitPrice: currentPriceSql(),
      },
      leftJoins: [
        { table: suppliers, on: eq(supplierItems.supplierId, suppliers.id) },
        { table: parties, on: eq(suppliers.partyId, parties.id) },
        { table: uom, on: eq(supplierItems.uomId, uom.id) },
      ],
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
    });
  }

  // Returns linked inventory item IDs for a supplier
  async findItemIdsBySupplierId(supplierId: string): Promise<string[]> {
    const rows = await this.db
      .select({ inventoryItemId: supplierItems.inventoryItemId })
      .from(supplierItems)
      .where(eq(supplierItems.supplierId, supplierId));
    return rows.map((row) => row.inventoryItemId);
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

  // Clears is_preferred on all supplier_items for an inventory item except the given row.
  // Used to enforce at-most-one preferred supplier per item before flipping a new one to preferred.
  async clearPreferredForOtherSuppliers(inventoryItemId: string, exceptSupplierItemId?: string): Promise<void> {
    const where = exceptSupplierItemId
      ? and(eq(supplierItems.inventoryItemId, inventoryItemId), ne(supplierItems.id, exceptSupplierItemId))
      : eq(supplierItems.inventoryItemId, inventoryItemId);
    await this.db.update(supplierItems).set({ isPreferred: false }).where(where);
  }

  // Deletes a supplier item link by ID
  async deleteSupplierItem(id: string): Promise<void> {
    await this.db.delete(supplierItems).where(eq(supplierItems.id, id));
  }

  // Bulk-deletes supplier item links by IDs
  async bulkDeleteSupplierItems(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.db.delete(supplierItems).where(inArray(supplierItems.id, ids));
  }

  // Bulk-sets the free-goods scheme on the given supplier item links
  async bulkSetScheme(
    ids: string[],
    scheme: { buyQty: number | null; freeQty: number | null; hasScheme: boolean },
  ): Promise<void> {
    if (ids.length === 0) return;
    await this.db
      .update(supplierItems)
      .set({ schemeBuyQty: scheme.buyQty, schemeFreeQty: scheme.freeQty, hasScheme: scheme.hasScheme })
      .where(inArray(supplierItems.id, ids));
  }

  // Bulk-sets is_preferred on the given supplier item links. When flipping to preferred, first clears
  // preferred on every other supplier for the same inventory items so the at-most-one-preferred unique
  // index is never violated.
  async bulkSetPreferred(ids: string[], isPreferred: boolean): Promise<void> {
    if (ids.length === 0) return;
    if (isPreferred) {
      const rows = await this.db
        .select({ inventoryItemId: supplierItems.inventoryItemId })
        .from(supplierItems)
        .where(inArray(supplierItems.id, ids));
      const inventoryItemIds = [...new Set(rows.map((row) => row.inventoryItemId))];
      if (inventoryItemIds.length > 0) {
        await this.db
          .update(supplierItems)
          .set({ isPreferred: false })
          .where(and(inArray(supplierItems.inventoryItemId, inventoryItemIds), notInArray(supplierItems.id, ids)));
      }
    }
    await this.db.update(supplierItems).set({ isPreferred }).where(inArray(supplierItems.id, ids));
  }

  // Finds a supplier item by ID with inventory item name and UOM symbol
  async findSupplierItemById(
    id: string,
  ): Promise<(SupplierItem & { inventoryItemName: string; uomSymbol: string }) | undefined> {
    const [row] = await this.db
      .select({
        ...getTableColumns(supplierItems),
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

  // Finds a supplier item by ID with display joins, supplier identity, and the resolved current price
  async findItemDetailById(id: string): Promise<
    | (SupplierItem & {
        inventoryItemName: string;
        uomSymbol: string;
        supplierCode: string | null;
        currentUnitPrice: bigint | null;
      })
    | undefined
  > {
    const [row] = await this.db
      .select({
        ...getTableColumns(supplierItems),
        inventoryItemName: inventoryItems.name,
        uomSymbol: uom.symbol,
        supplierCode: suppliers.code,
        currentUnitPrice: currentPriceSql(),
      })
      .from(supplierItems)
      .leftJoin(inventoryItems, eq(supplierItems.inventoryItemId, inventoryItems.id))
      .leftJoin(uom, eq(supplierItems.uomId, uom.id))
      .leftJoin(suppliers, eq(supplierItems.supplierId, suppliers.id))
      .where(eq(supplierItems.id, id))
      .limit(1);

    return row as
      | (SupplierItem & {
          inventoryItemName: string;
          uomSymbol: string;
          supplierCode: string | null;
          currentUnitPrice: bigint | null;
        })
      | undefined;
  }

  async findById(id: string): Promise<SupplierItem | undefined> {
    const [row] = await this.db.select().from(supplierItems).where(eq(supplierItems.id, id)).limit(1);
    return row as SupplierItem | undefined;
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

  // Bulk-updates currency on a supplier's items and rescales their whole price timelines by the conversion rate
  async recalculateAllForSupplier(supplierId: string, newCurrencyCode: string, conversionRate: number): Promise<void> {
    await this.db
      .update(supplierItems)
      .set({ currencyCode: newCurrencyCode })
      .where(eq(supplierItems.supplierId, supplierId));
    await this.db
      .update(supplierItemPrices)
      .set({ unitPrice: sql`ROUND(${supplierItemPrices.unitPrice}::numeric * ${conversionRate})::bigint` })
      .where(
        inArray(
          supplierItemPrices.supplierItemId,
          this.db.select({ id: supplierItems.id }).from(supplierItems).where(eq(supplierItems.supplierId, supplierId)),
        ),
      );
  }

  // Returns paginated price timeline rows of a supplier item — site rows scoped by the session site GUC
  async findPricesForTable(
    supplierItemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: SupplierItemPrice[]; count: number }> {
    const baseWhere = and(
      eq(supplierItemPrices.supplierItemId, supplierItemId),
      sql`(${supplierItemPrices.siteId} IS NULL OR ${supplierItemPrices.siteId} = current_setting('app.site_id', true)::uuid)`,
    ) as SQL;
    const where = options.where ? (and(baseWhere, options.where) as SQL) : baseWhere;

    const rowsPromise = this.db
      .select()
      .from(supplierItemPrices)
      .where(where)
      .orderBy(...(options.orderBy?.length ? options.orderBy : [desc(supplierItemPrices.validFrom)]))
      .limit(options.limit)
      .offset(options.offset);

    const countPromise = this.db.select({ count: sql<number>`count(*)::int` }).from(supplierItemPrices).where(where);

    const [rows, countResult] = await Promise.all([rowsPromise, countPromise]);
    return { result: rows as SupplierItemPrice[], count: countResult[0]?.count ?? 0 };
  }

  // Resolves the price effective on a date — site row wins over general within the session site GUC
  async resolvePrice(supplierItemId: string, onDate?: string): Promise<SupplierItemPrice | undefined> {
    const dateExpr = onDate ? sql`${onDate}::date` : sql`CURRENT_DATE`;
    const [row] = await this.db
      .select()
      .from(supplierItemPrices)
      .where(
        and(
          eq(supplierItemPrices.supplierItemId, supplierItemId),
          sql`${supplierItemPrices.validFrom} <= ${dateExpr}`,
          sql`(${supplierItemPrices.validTo} IS NULL OR ${supplierItemPrices.validTo} >= ${dateExpr})`,
          sql`(${supplierItemPrices.siteId} IS NULL OR ${supplierItemPrices.siteId} = current_setting('app.site_id', true)::uuid)`,
        ),
      )
      .orderBy(asc(sql`(${supplierItemPrices.siteId} IS NULL)`), desc(supplierItemPrices.validFrom))
      .limit(1);
    return row as SupplierItemPrice | undefined;
  }

  // Returns true when the session-context stratum has a row effective on or after the date
  async hasPriceOnOrAfter(supplierItemId: string, validFrom: string): Promise<boolean> {
    return this.priceExists(
      and(
        eq(supplierItemPrices.supplierItemId, supplierItemId),
        gucStratumSql(),
        sql`${supplierItemPrices.validFrom} >= ${validFrom}::date`,
      ) as SQL,
    );
  }

  // Closes the stratum's open-ended row to the day before the new price takes effect
  async closeOpenPrice(supplierItemId: string, newValidFrom: string): Promise<void> {
    await this.db
      .update(supplierItemPrices)
      .set({ validTo: sql`${newValidFrom}::date - 1` })
      .where(
        and(
          eq(supplierItemPrices.supplierItemId, supplierItemId),
          gucStratumSql(),
          sql`${supplierItemPrices.validTo} IS NULL`,
          sql`${supplierItemPrices.validFrom} < ${newValidFrom}::date`,
        ),
      );
  }

  // Inserts a price row — site_id is never passed so the DB GUC default assigns the stratum
  async insertPrice(data: Omit<NewSupplierItemPrice, 'siteId' | 'organizationId'>): Promise<SupplierItemPrice> {
    const [row] = await this.db.insert(supplierItemPrices).values(data).returning();
    return row as SupplierItemPrice;
  }

  // Loads a single price row by id
  async findPriceById(id: string): Promise<SupplierItemPrice | undefined> {
    const [row] = await this.db.select().from(supplierItemPrices).where(eq(supplierItemPrices.id, id)).limit(1);
    return row as SupplierItemPrice | undefined;
  }

  // Returns the next row after a validity start within the row's own stratum
  async findNextPrice(
    supplierItemId: string,
    siteId: string | null,
    afterValidFrom: string,
  ): Promise<SupplierItemPrice | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierItemPrices)
      .where(
        and(
          eq(supplierItemPrices.supplierItemId, supplierItemId),
          rowStratumSql(siteId),
          sql`${supplierItemPrices.validFrom} > ${afterValidFrom}::date`,
        ),
      )
      .orderBy(asc(supplierItemPrices.validFrom))
      .limit(1);
    return row as SupplierItemPrice | undefined;
  }

  // Returns the stratum row that was delimited to exactly the day before the given validity start
  async findContiguousPreviousPrice(
    supplierItemId: string,
    siteId: string | null,
    validFrom: string,
  ): Promise<SupplierItemPrice | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierItemPrices)
      .where(
        and(
          eq(supplierItemPrices.supplierItemId, supplierItemId),
          rowStratumSql(siteId),
          sql`${supplierItemPrices.validTo} = ${validFrom}::date - 1`,
        ),
      )
      .limit(1);
    return row as SupplierItemPrice | undefined;
  }

  // Updates a price row by id
  async updatePriceRow(id: string, data: Partial<NewSupplierItemPrice>): Promise<void> {
    await this.db.update(supplierItemPrices).set(data).where(eq(supplierItemPrices.id, id));
  }

  // Deletes a price row by id
  async deletePriceRow(id: string): Promise<void> {
    await this.db.delete(supplierItemPrices).where(eq(supplierItemPrices.id, id));
  }

  // Returns true when a price row exists matching the condition
  private async priceExists(where: SQL): Promise<boolean> {
    const [row] = await this.db.select({ one: sql`1` }).from(supplierItemPrices).where(where).limit(1);
    return Boolean(row);
  }

  // Returns true when the row's stratum has a later-starting row
  async hasLaterPrice(supplierItemId: string, siteId: string | null, validFrom: string): Promise<boolean> {
    return this.priceExists(
      and(
        eq(supplierItemPrices.supplierItemId, supplierItemId),
        rowStratumSql(siteId),
        sql`${supplierItemPrices.validFrom} > ${validFrom}::date`,
      ) as SQL,
    );
  }

  // Returns paginated per-site override rows of a supplier item
  async findItemSitesForTable(
    supplierItemId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: SupplierItemSite[]; count: number }> {
    const baseWhere = eq(supplierItemSites.supplierItemId, supplierItemId);
    const where = options.where ? (and(baseWhere, options.where) as SQL) : baseWhere;

    const rowsPromise = this.db
      .select()
      .from(supplierItemSites)
      .where(where)
      .orderBy(...(options.orderBy?.length ? options.orderBy : [desc(supplierItemSites.createdAt)]))
      .limit(options.limit)
      .offset(options.offset);

    const countPromise = this.db.select({ count: sql<number>`count(*)::int` }).from(supplierItemSites).where(where);

    const [rows, countResult] = await Promise.all([rowsPromise, countPromise]);
    return { result: rows as SupplierItemSite[], count: countResult[0]?.count ?? 0 };
  }

  // Inserts or updates the per-site override for a (supplier item, site) pair
  async upsertItemSite(data: NewSupplierItemSite): Promise<SupplierItemSite> {
    const [row] = await this.db
      .insert(supplierItemSites)
      .values(data)
      .onConflictDoUpdate({
        target: [supplierItemSites.supplierItemId, supplierItemSites.siteId],
        set: { leadTimeDays: data.leadTimeDays ?? null, minOrderQuantity: data.minOrderQuantity ?? null },
      })
      .returning();
    return row as SupplierItemSite;
  }

  // Loads a per-site override row by id
  async findItemSiteById(id: string): Promise<SupplierItemSite | undefined> {
    const [row] = await this.db.select().from(supplierItemSites).where(eq(supplierItemSites.id, id)).limit(1);
    return row as SupplierItemSite | undefined;
  }

  // Loads the per-site override of a supplier item for a site
  async findItemSite(supplierItemId: string, siteId: string): Promise<SupplierItemSite | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierItemSites)
      .where(and(eq(supplierItemSites.supplierItemId, supplierItemId), eq(supplierItemSites.siteId, siteId)))
      .limit(1);
    return row as SupplierItemSite | undefined;
  }

  // Updates a per-site override row by id
  async updateItemSite(id: string, data: Partial<NewSupplierItemSite>): Promise<void> {
    await this.db.update(supplierItemSites).set(data).where(eq(supplierItemSites.id, id));
  }

  // Deletes a per-site override row by id
  async deleteItemSite(id: string): Promise<void> {
    await this.db.delete(supplierItemSites).where(eq(supplierItemSites.id, id));
  }
}

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, getColumns, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type InventoryItemMrp,
  inventoryItemMrps,
  type NewSupplierItemPrice,
  parties,
  type SupplierItemPrice,
  supplierItemPrices,
  supplierItemSites,
  supplierItems,
  suppliers,
  uom,
} from '@/db/schema';

export type SupplierItemPriceRow = SupplierItemPrice & { mrpAmount: bigint | null };

export type ItemSupplierPriceRow = SupplierItemPriceRow & {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  uomSymbol: string | null;
};

export type ItemPriceAtSiteRow = SupplierItemPrice & {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  uomId: string;
  uomSymbol: string | null;
  mrpAmount: bigint | null;
};

@Injectable()
export class SupplierItemPricesDomainRepository extends PrimaryBaseRepository<typeof supplierItemPrices> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierItemPrices);
  }

  // Returns paginated price timeline rows of a supplier item — one site's rows, or every site's when none is given
  findPricesForTable(
    supplierItemId: string,
    siteId: string | null,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: SupplierItemPriceRow[]; count: number }> {
    return this.findAllAndCount<SupplierItemPriceRow>({
      select: { ...getColumns(supplierItemPrices), mrpAmount: inventoryItemMrps.amount },
      leftJoin: { table: inventoryItemMrps, on: eq(inventoryItemMrps.id, supplierItemPrices.mrpId) },
      where: and(
        eq(supplierItemPrices.supplierItemId, supplierItemId),
        siteId ? eq(supplierItemPrices.siteId, siteId) : undefined,
        options.where,
      ),
      orderBy: options.orderBy?.length ? options.orderBy : [desc(supplierItemPrices.validFrom)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Returns paginated price rows of every supplier for an inventory item at one site, with the supplier and the unit
  // each quotes in
  findItemPricesAtSiteForTable(
    inventoryItemId: string,
    siteId: string,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: ItemSupplierPriceRow[]; count: number }> {
    return this.findAllAndCount<ItemSupplierPriceRow>({
      select: {
        ...getColumns(supplierItemPrices),
        mrpAmount: inventoryItemMrps.amount,
        supplierId: supplierItems.supplierId,
        supplierName: parties.displayName,
        supplierCode: suppliers.code,
        uomSymbol: uom.symbol,
      },
      innerJoins: [
        { table: supplierItems, on: eq(supplierItems.id, supplierItemPrices.supplierItemId) },
        { table: suppliers, on: eq(suppliers.id, supplierItems.supplierId) },
        { table: parties, on: eq(parties.id, suppliers.partyId) },
      ],
      leftJoins: [
        { table: inventoryItemMrps, on: eq(inventoryItemMrps.id, supplierItemPrices.mrpId) },
        { table: uom, on: eq(uom.id, supplierItems.uomId) },
      ],
      where: and(
        eq(supplierItems.inventoryItemId, inventoryItemId),
        eq(supplierItemPrices.siteId, siteId),
        options.where,
      ),
      orderBy: options.orderBy?.length ? options.orderBy : [desc(supplierItemPrices.validFrom)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Every price window of a supplier item, unpaged — optionally narrowed to sites and to windows overlapping a date
  // range — ordered by site then start date
  async findPriceHistory(
    supplierItemId: string,
    options: { siteIds?: string[]; from?: string; to?: string },
  ): Promise<SupplierItemPrice[]> {
    const rows = await this.db
      .select()
      .from(supplierItemPrices)
      .where(
        and(
          eq(supplierItemPrices.supplierItemId, supplierItemId),
          options.siteIds?.length ? inArray(supplierItemPrices.siteId, options.siteIds) : undefined,
          options.to ? sql`${supplierItemPrices.validFrom} <= ${options.to}::date` : undefined,
          options.from
            ? sql`(${supplierItemPrices.validTo} IS NULL OR ${supplierItemPrices.validTo} >= ${options.from}::date)`
            : undefined,
        ),
      )
      .orderBy(asc(supplierItemPrices.siteId), asc(supplierItemPrices.validFrom));
    return rows as SupplierItemPrice[];
  }

  // The sites where any supplier has priced an inventory item
  async findSiteIdsWithItemPrices(inventoryItemId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ siteId: supplierItemPrices.siteId })
      .from(supplierItemPrices)
      .innerJoin(supplierItems, eq(supplierItems.id, supplierItemPrices.supplierItemId))
      .where(eq(supplierItems.inventoryItemId, inventoryItemId));
    return rows.map((row) => row.siteId);
  }

  // Every supplier's price rows for an inventory item at one site, with the supplier and the unit each quotes in,
  // ordered per supplier item then by start date
  async findItemPriceHistoryAtSite(
    inventoryItemId: string,
    siteId: string,
    options: { from?: string; to?: string; mrpIds?: string[] },
  ): Promise<ItemPriceAtSiteRow[]> {
    const rows = await this.db
      .select({
        ...getColumns(supplierItemPrices),
        supplierId: supplierItems.supplierId,
        supplierName: parties.displayName,
        supplierCode: suppliers.code,
        uomId: supplierItems.uomId,
        uomSymbol: uom.symbol,
        mrpAmount: inventoryItemMrps.amount,
      })
      .from(supplierItemPrices)
      .innerJoin(supplierItems, eq(supplierItems.id, supplierItemPrices.supplierItemId))
      .innerJoin(suppliers, eq(suppliers.id, supplierItems.supplierId))
      .innerJoin(parties, eq(parties.id, suppliers.partyId))
      .leftJoin(uom, eq(uom.id, supplierItems.uomId))
      .leftJoin(inventoryItemMrps, eq(inventoryItemMrps.id, supplierItemPrices.mrpId))
      .where(
        and(
          eq(supplierItems.inventoryItemId, inventoryItemId),
          eq(supplierItemPrices.siteId, siteId),
          options.mrpIds?.length ? inArray(supplierItemPrices.mrpId, options.mrpIds) : undefined,
          options.to ? sql`${supplierItemPrices.validFrom} <= ${options.to}::date` : undefined,
          options.from
            ? sql`(${supplierItemPrices.validTo} IS NULL OR ${supplierItemPrices.validTo} >= ${options.from}::date)`
            : undefined,
        ),
      )
      .orderBy(asc(parties.displayName), asc(supplierItemPrices.supplierItemId), asc(supplierItemPrices.validFrom));
    return rows as ItemPriceAtSiteRow[];
  }

  // The supplier items set up as preferred for an inventory item at a site
  async findPreferredSupplierItemIdsAtSite(inventoryItemId: string, siteId: string): Promise<string[]> {
    const rows = await this.db
      .select({ supplierItemId: supplierItemSites.supplierItemId })
      .from(supplierItemSites)
      .where(
        and(
          eq(supplierItemSites.inventoryItemId, inventoryItemId),
          eq(supplierItemSites.siteId, siteId),
          eq(supplierItemSites.isPreferred, true),
        ),
      );
    return rows.map((row) => row.supplierItemId);
  }

  // Resolves a site's price effective on a date
  async resolvePrice(supplierItemId: string, siteId: string, onDate?: string): Promise<SupplierItemPrice | undefined> {
    const dateExpr = onDate ? sql`${onDate}::date` : sql`CURRENT_DATE`;
    const [row] = await this.db
      .select()
      .from(supplierItemPrices)
      .where(
        and(
          eq(supplierItemPrices.supplierItemId, supplierItemId),
          eq(supplierItemPrices.siteId, siteId),
          sql`${supplierItemPrices.validFrom} <= ${dateExpr}`,
          sql`(${supplierItemPrices.validTo} IS NULL OR ${supplierItemPrices.validTo} >= ${dateExpr})`,
        ),
      )
      .orderBy(desc(supplierItemPrices.validFrom))
      .limit(1);
    return row as SupplierItemPrice | undefined;
  }

  // Returns true when the site has a row starting on or after the date
  async hasPriceOnOrAfter(supplierItemId: string, siteId: string, validFrom: string): Promise<boolean> {
    return this.priceExists(
      and(
        eq(supplierItemPrices.supplierItemId, supplierItemId),
        eq(supplierItemPrices.siteId, siteId),
        sql`${supplierItemPrices.validFrom} >= ${validFrom}::date`,
      ) as SQL,
    );
  }

  // Closes the site's open-ended row to the day before the new price takes effect
  async closeOpenPrice(supplierItemId: string, siteId: string, newValidFrom: string): Promise<void> {
    await this.db
      .update(supplierItemPrices)
      .set({ validTo: sql`${newValidFrom}::date - 1` })
      .where(
        and(
          eq(supplierItemPrices.supplierItemId, supplierItemId),
          eq(supplierItemPrices.siteId, siteId),
          sql`${supplierItemPrices.validTo} IS NULL`,
          sql`${supplierItemPrices.validFrom} < ${newValidFrom}::date`,
        ),
      );
  }

  async insertPrice(data: Omit<NewSupplierItemPrice, 'organizationId'>): Promise<SupplierItemPrice> {
    const [row] = await this.db.insert(supplierItemPrices).values(data).returning();
    return row as SupplierItemPrice;
  }

  // Loads a single price row by id
  async findPriceById(id: string): Promise<SupplierItemPrice | undefined> {
    const [row] = await this.db.select().from(supplierItemPrices).where(eq(supplierItemPrices.id, id)).limit(1);
    return row as SupplierItemPrice | undefined;
  }

  // Returns the site's row that was delimited to exactly the day before the given validity start
  async findContiguousPreviousPrice(
    supplierItemId: string,
    siteId: string,
    validFrom: string,
  ): Promise<SupplierItemPrice | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierItemPrices)
      .where(
        and(
          eq(supplierItemPrices.supplierItemId, supplierItemId),
          eq(supplierItemPrices.siteId, siteId),
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

  // Returns the price rows a quotation posted at one site
  async findPricesByQuotationSite(quotationSiteId: string): Promise<SupplierItemPrice[]> {
    const rows = await this.db
      .select()
      .from(supplierItemPrices)
      .where(eq(supplierItemPrices.quotationSiteId, quotationSiteId));
    return rows as SupplierItemPrice[];
  }

  // Returns the site's earliest row starting after the given date
  async findNextPrice(
    supplierItemId: string,
    siteId: string,
    validFrom: string,
  ): Promise<SupplierItemPrice | undefined> {
    const [row] = await this.db
      .select()
      .from(supplierItemPrices)
      .where(
        and(
          eq(supplierItemPrices.supplierItemId, supplierItemId),
          eq(supplierItemPrices.siteId, siteId),
          sql`${supplierItemPrices.validFrom} > ${validFrom}::date`,
        ),
      )
      .orderBy(asc(supplierItemPrices.validFrom))
      .limit(1);
    return row as SupplierItemPrice | undefined;
  }

  // Returns true when the site has a later-starting row
  async hasLaterPrice(supplierItemId: string, siteId: string, validFrom: string): Promise<boolean> {
    return this.priceExists(
      and(
        eq(supplierItemPrices.supplierItemId, supplierItemId),
        eq(supplierItemPrices.siteId, siteId),
        sql`${supplierItemPrices.validFrom} > ${validFrom}::date`,
      ) as SQL,
    );
  }

  async findPriceContext(supplierItemId: string): Promise<
    | {
        supplierId: string;
        legalEntityId: string;
        inventoryItemId: string;
        uomId: string;
        currencyCode: string;
        currencyCodes: string[];
      }
    | undefined
  > {
    const [row] = await this.db
      .select({
        supplierId: supplierItems.supplierId,
        legalEntityId: suppliers.legalEntityId,
        inventoryItemId: supplierItems.inventoryItemId,
        uomId: supplierItems.uomId,
        currencyCode: suppliers.currencyCode,
        currencyCodes: suppliers.currencyCodes,
      })
      .from(supplierItems)
      .innerJoin(suppliers, eq(suppliers.id, supplierItems.supplierId))
      .where(eq(supplierItems.id, supplierItemId))
      .limit(1);
    return row;
  }

  async findMrp(mrpId: string): Promise<InventoryItemMrp | undefined> {
    const [row] = await this.db.select().from(inventoryItemMrps).where(eq(inventoryItemMrps.id, mrpId)).limit(1);
    return row as InventoryItemMrp | undefined;
  }

  // The sites a supplier item is set up at — a price can only be added where the item is carried
  async findCarriedSiteIds(supplierItemId: string): Promise<string[]> {
    const rows = await this.db
      .select({ siteId: supplierItemSites.siteId })
      .from(supplierItemSites)
      .where(eq(supplierItemSites.supplierItemId, supplierItemId));
    return rows.map((row) => row.siteId);
  }

  // A site's price in force today for a supplier's item in a unit, or undefined when the supplier does not carry it
  // or has no price there
  async resolvePriceFor(
    supplierId: string,
    inventoryItemId: string,
    uomId: string,
    siteId: string,
  ): Promise<SupplierItemPrice | undefined> {
    const [item] = await this.db
      .select({ id: supplierItems.id })
      .from(supplierItems)
      .where(
        and(
          eq(supplierItems.supplierId, supplierId),
          eq(supplierItems.inventoryItemId, inventoryItemId),
          eq(supplierItems.uomId, uomId),
        ),
      )
      .limit(1);
    return item ? this.resolvePrice(item.id, siteId) : undefined;
  }
}

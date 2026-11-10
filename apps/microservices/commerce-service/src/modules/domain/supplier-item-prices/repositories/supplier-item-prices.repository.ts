import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, getColumns, isNull, notExists, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { alias } from '@vritti/api-sdk/drizzle-pg-core';
import {
  type InventoryItemMrp,
  inventoryItemMrps,
  type NewSupplierItemPrice,
  parties,
  type SupplierItemPrice,
  supplierItemPrices,
  supplierItems,
  supplierSiteItems,
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

// One stratum of prices: a site's own, or the legal entity's when the site is empty
function inStratum(siteId: string | null): SQL {
  return siteId ? eq(supplierItemPrices.siteId, siteId) : isNull(supplierItemPrices.siteId);
}

// What a site reads: its own prices and the legal entity's it falls back to where it has none in force
function atSiteOrLegalEntity(siteId: string): SQL {
  return or(eq(supplierItemPrices.siteId, siteId), isNull(supplierItemPrices.siteId)) as SQL;
}

@Injectable()
export class SupplierItemPricesDomainRepository extends PrimaryBaseRepository<typeof supplierItemPrices> {
  constructor(database: PrimaryDatabaseService) {
    super(database, supplierItemPrices);
  }

  // Returns paginated price timeline rows of a supplier item, as the given site reads them when one is given
  findPricesForTable(
    supplierItemId: string,
    readingSiteId: string | undefined,
    options: { where?: SQL; orderBy?: SQL[]; limit: number; offset: number },
  ): Promise<{ result: SupplierItemPriceRow[]; count: number }> {
    return this.findAllAndCount<SupplierItemPriceRow>({
      select: { ...getColumns(supplierItemPrices), mrpAmount: inventoryItemMrps.amount },
      leftJoin: { table: inventoryItemMrps, on: eq(inventoryItemMrps.id, supplierItemPrices.mrpId) },
      where: and(
        eq(supplierItemPrices.supplierItemId, supplierItemId),
        readingSiteId ? atSiteOrLegalEntity(readingSiteId) : undefined,
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
      where: and(eq(supplierItems.inventoryItemId, inventoryItemId), atSiteOrLegalEntity(siteId), options.where),
      orderBy: options.orderBy?.length ? options.orderBy : [desc(supplierItemPrices.validFrom)],
      limit: options.limit,
      offset: options.offset,
    });
  }

  // A supplier item's price windows at the given sites (every site when none are given) and the legal entity's,
  // overlapping a date range, unpaged, ordered by site (the legal entity's first) then start date
  async findPriceHistory(supplierItemId: string, where: SQL | undefined): Promise<SupplierItemPrice[]> {
    const rows = await this.db
      .select()
      .from(supplierItemPrices)
      .where(and(eq(supplierItemPrices.supplierItemId, supplierItemId), where))
      .orderBy(sql`${supplierItemPrices.siteId} asc nulls first`, asc(supplierItemPrices.validFrom));
    return rows as SupplierItemPrice[];
  }

  // Every supplier's price rows for an inventory item at one site, with the supplier and the unit each quotes in,
  // ordered per supplier item then by start date; a supplier item the site has never priced shows the legal entity's
  async findItemPriceHistoryAtSite(
    inventoryItemId: string,
    siteId: string,
    where: SQL | undefined,
  ): Promise<ItemPriceAtSiteRow[]> {
    const ownPrices = alias(supplierItemPrices, 'own_prices');
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
          or(
            eq(supplierItemPrices.siteId, siteId),
            and(
              isNull(supplierItemPrices.siteId),
              notExists(
                this.db
                  .select({ one: sql`1` })
                  .from(ownPrices)
                  .where(
                    and(eq(ownPrices.supplierItemId, supplierItemPrices.supplierItemId), eq(ownPrices.siteId, siteId)),
                  ),
              ),
            ),
          ),
          where,
        ),
      )
      .orderBy(asc(parties.displayName), asc(supplierItemPrices.supplierItemId), asc(supplierItemPrices.validFrom));
    return rows as ItemPriceAtSiteRow[];
  }

  // The supplier items set up as preferred for an inventory item at a site
  async findPreferredSupplierItemIdsAtSite(inventoryItemId: string, siteId: string): Promise<string[]> {
    const rows = await this.db
      .select({ supplierItemId: supplierSiteItems.supplierItemId })
      .from(supplierSiteItems)
      .where(
        and(
          eq(supplierSiteItems.inventoryItemId, inventoryItemId),
          eq(supplierSiteItems.siteId, siteId),
          eq(supplierSiteItems.isPreferred, true),
        ),
      );
    return rows.map((row) => row.supplierItemId);
  }

  // Resolves the price a site pays on a date: its own in force, else the legal entity's in force
  async resolvePrice(supplierItemId: string, siteId: string, onDate?: string): Promise<SupplierItemPrice | undefined> {
    const dateExpr = onDate ? sql`${onDate}::date` : sql`CURRENT_DATE`;
    const [row] = await this.db
      .select()
      .from(supplierItemPrices)
      .where(
        and(
          eq(supplierItemPrices.supplierItemId, supplierItemId),
          atSiteOrLegalEntity(siteId),
          sql`${supplierItemPrices.validFrom} <= ${dateExpr}`,
          sql`(${supplierItemPrices.validTo} IS NULL OR ${supplierItemPrices.validTo} >= ${dateExpr})`,
        ),
      )
      .orderBy(sql`${supplierItemPrices.siteId} is null`, desc(supplierItemPrices.validFrom))
      .limit(1);
    return row as SupplierItemPrice | undefined;
  }

  // Returns true when the stratum (a site, or the legal entity when empty) has a row starting on or after the date
  async hasPriceOnOrAfter(supplierItemId: string, siteId: string | null, validFrom: string): Promise<boolean> {
    return this.priceExists(
      and(
        eq(supplierItemPrices.supplierItemId, supplierItemId),
        inStratum(siteId),
        sql`${supplierItemPrices.validFrom} >= ${validFrom}::date`,
      ) as SQL,
    );
  }

  // Closes the stratum's open-ended row to the day before the new price takes effect
  async closeOpenPrice(supplierItemId: string, siteId: string | null, newValidFrom: string): Promise<void> {
    await this.db
      .update(supplierItemPrices)
      .set({ validTo: sql`${newValidFrom}::date - 1` })
      .where(
        and(
          eq(supplierItemPrices.supplierItemId, supplierItemId),
          inStratum(siteId),
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

  // Returns the stratum's row that was delimited to exactly the day before the given validity start
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
          inStratum(siteId),
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

  // Returns the stratum's earliest row starting after the given date
  async findNextPrice(
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
          inStratum(siteId),
          sql`${supplierItemPrices.validFrom} > ${validFrom}::date`,
        ),
      )
      .orderBy(asc(supplierItemPrices.validFrom))
      .limit(1);
    return row as SupplierItemPrice | undefined;
  }

  // Returns true when the stratum has a later-starting row
  async hasLaterPrice(supplierItemId: string, siteId: string | null, validFrom: string): Promise<boolean> {
    return this.priceExists(
      and(
        eq(supplierItemPrices.supplierItemId, supplierItemId),
        inStratum(siteId),
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
      .select({ siteId: supplierSiteItems.siteId })
      .from(supplierSiteItems)
      .where(eq(supplierSiteItems.supplierItemId, supplierItemId));
    return rows.map((row) => row.siteId);
  }
}

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, inArray, isNull, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type CatalogListing,
  catalogChannels,
  catalogListingChannelExclusions,
  catalogListingPrices,
  catalogListings,
  type InventoryItemMrp,
  inventoryItemMrps,
  listingPriceSpecificity,
  type NewCatalogListing,
  offerings,
  offeringVariants,
  ownedByWorkspaceExpression,
  uom,
} from '@/db/schema';
import type { CatalogListingPriceRow, CatalogListingRow } from '../dto/entity/catalog-listing.dto';

@Injectable()
export class CatalogListingsDomainRepository extends PrimaryBaseRepository<typeof catalogListings> {
  constructor(database: PrimaryDatabaseService) {
    super(database, catalogListings);
  }

  private selection() {
    return {
      id: catalogListings.id,
      catalogId: catalogListings.catalogId,
      offeringVariantId: catalogListings.offeringVariantId,
      legalEntityId: catalogListings.legalEntityId,
      siteId: catalogListings.siteId,
      isOwned: ownedByWorkspaceExpression(catalogListings),
      inventoryItemMrpId: catalogListings.inventoryItemMrpId,
      code: offeringVariants.code,
      offeringName: offerings.name,
      dimensions: offeringVariants.dimensions,
      attributes: offeringVariants.attributes,
      isVariantActive: offeringVariants.isActive,
      isOfferingActive: offeringVariants.isOfferingActive,
      mrpAmount: inventoryItemMrps.amount,
      mrpCurrencyCode: inventoryItemMrps.currencyCode,
      mrpUomSymbol: uom.symbol,
      createdAt: catalogListings.createdAt,
      updatedAt: catalogListings.updatedAt,
    };
  }

  // Both FKs are NOT NULL, so inner-joining is what makes `code` and `offeringName` non-null here
  private variantJoin() {
    return [
      { table: offeringVariants, on: eq(offeringVariants.id, catalogListings.offeringVariantId) },
      { table: offerings, on: eq(offerings.id, offeringVariants.offeringId) },
    ];
  }

  // An MRP is optional, and its uom hangs off the MRP, so both are genuinely absent sometimes
  private mrpJoins() {
    return [
      { table: inventoryItemMrps, on: eq(inventoryItemMrps.id, catalogListings.inventoryItemMrpId) },
      { table: uom, on: eq(uom.id, inventoryItemMrps.uomId) },
    ];
  }

  // One page of a catalog's listings with the variant and MRP each one carries
  async findForTable(options: {
    where: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: CatalogListingRow[]; count: number }> {
    return this.findAllAndCount<CatalogListingRow>({
      select: this.selection(),
      innerJoins: this.variantJoin(),
      leftJoins: this.mrpJoins(),
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  async findByIdWithRefs(id: string): Promise<CatalogListingRow | undefined> {
    const { result } = await this.findAllAndCount<CatalogListingRow>({
      select: this.selection(),
      innerJoins: this.variantJoin(),
      leftJoins: this.mrpJoins(),
      where: eq(catalogListings.id, id),
      limit: 1,
      offset: 0,
    });
    return result[0];
  }

  async insertListing(row: NewCatalogListing): Promise<CatalogListing> {
    const [created] = (await this.db.insert(catalogListings).values(row).returning()) as CatalogListing[];
    return created;
  }

  // One insert, so a batch of listings either lands whole or not at all
  async insertListings(rows: NewCatalogListing[]): Promise<CatalogListing[]> {
    if (rows.length === 0) return [];
    return (await this.db.insert(catalogListings).values(rows).returning()) as CatalogListing[];
  }

  async deleteListing(id: string): Promise<void> {
    await this.db.delete(catalogListings).where(eq(catalogListings.id, id));
  }

  // The selected listings that really are in this catalog, with ownership, for one batch to be judged whole
  async findManyInCatalog(catalogId: string, ids: string[]): Promise<CatalogListingRow[]> {
    if (ids.length === 0) return [];
    const { result } = await this.findAllAndCount<CatalogListingRow>({
      select: this.selection(),
      innerJoins: this.variantJoin(),
      leftJoins: this.mrpJoins(),
      where: and(eq(catalogListings.catalogId, catalogId), inArray(catalogListings.id, ids)) as SQL,
      orderBy: [asc(offeringVariants.code)],
      limit: ids.length,
      offset: 0,
    });
    return result;
  }

  // One statement, so a batch either goes or does not
  async deleteListings(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const rows = await this.db.delete(catalogListings).where(inArray(catalogListings.id, ids)).returning({
      id: catalogListings.id,
    });
    return rows.length;
  }

  // This workspace's own price for each listing, in one insert
  async upsertPrices(catalogListingIds: string[], currencyCode: string, amount: bigint): Promise<void> {
    if (catalogListingIds.length === 0) return;
    await this.db
      .insert(catalogListingPrices)
      .values(catalogListingIds.map((catalogListingId) => ({ catalogListingId, currencyCode, amount })))
      .onConflictDoUpdate({
        target: [
          catalogListingPrices.catalogListingId,
          catalogListingPrices.currencyCode,
          catalogListingPrices.legalEntityId,
          catalogListingPrices.siteId,
        ],
        set: { amount },
      });
  }

  // Prices several listings at once, each at its own amount
  async upsertPriceRows(rows: { catalogListingId: string; currencyCode: string; amount: bigint }[]): Promise<void> {
    if (rows.length === 0) return;
    await this.db
      .insert(catalogListingPrices)
      .values(rows)
      .onConflictDoUpdate({
        target: [
          catalogListingPrices.catalogListingId,
          catalogListingPrices.currencyCode,
          catalogListingPrices.legalEntityId,
          catalogListingPrices.siteId,
        ],
        set: { amount: sql`excluded.${sql.raw(catalogListingPrices.amount.name)}` },
      });
  }

  // Excludes every listing from every named channel — the cross product in one insert
  async addExclusions(catalogListingIds: string[], catalogChannelIds: string[]): Promise<void> {
    if (catalogListingIds.length === 0 || catalogChannelIds.length === 0) return;
    const rows = catalogListingIds.flatMap((catalogListingId) =>
      catalogChannelIds.map((catalogChannelId) => ({ catalogListingId, catalogChannelId })),
    );
    await this.db.insert(catalogListingChannelExclusions).values(rows).onConflictDoNothing();
  }

  // Drops the outright exclusions only: one naming a currency is the Prices tab's to clear
  async removeExclusions(catalogListingIds: string[], catalogChannelIds: string[]): Promise<void> {
    if (catalogListingIds.length === 0 || catalogChannelIds.length === 0) return;
    await this.db
      .delete(catalogListingChannelExclusions)
      .where(
        and(
          inArray(catalogListingChannelExclusions.catalogListingId, catalogListingIds),
          inArray(catalogListingChannelExclusions.catalogChannelId, catalogChannelIds),
          isNull(catalogListingChannelExclusions.currencyCode),
        ),
      );
  }

  // The channels among these that this workspace does not own, so a batch is refused before it writes
  async findUnownedChannels(catalogChannelIds: string[]): Promise<string[]> {
    if (catalogChannelIds.length === 0) return [];
    const rows = await this.db
      .select({ id: catalogChannels.id, isOwn: ownedByWorkspaceExpression(catalogChannels) })
      .from(catalogChannels)
      .where(inArray(catalogChannels.id, catalogChannelIds));
    const found = new Set(rows.map((row) => row.id));
    const missing = catalogChannelIds.filter((id) => !found.has(id));
    return [...missing, ...rows.filter((row) => !row.isOwn).map((row) => row.id)];
  }

  // A variant is listed either generally or by MRP slice — never both in one catalog
  async findSiblingListings(catalogId: string, offeringVariantId: string): Promise<CatalogListing[]> {
    return this.db
      .select()
      .from(catalogListings)
      .where(and(eq(catalogListings.catalogId, catalogId), eq(catalogListings.offeringVariantId, offeringVariantId)));
  }

  // Every listing a batch of variants already has here, read once rather than per variant
  async findSiblingListingsForVariants(catalogId: string, offeringVariantIds: string[]): Promise<CatalogListing[]> {
    if (offeringVariantIds.length === 0) return [];
    return this.db
      .select()
      .from(catalogListings)
      .where(
        and(eq(catalogListings.catalogId, catalogId), inArray(catalogListings.offeringVariantId, offeringVariantIds)),
      );
  }

  // The MRP a listing keys on, for validating the price against its printed ceiling
  async findMrpById(id: string): Promise<InventoryItemMrp | undefined> {
    const [row] = await this.db.select().from(inventoryItemMrps).where(eq(inventoryItemMrps.id, id)).limit(1);
    return row;
  }

  async findMrpsByIds(ids: string[]): Promise<InventoryItemMrp[]> {
    if (ids.length === 0) return [];
    return this.db.select().from(inventoryItemMrps).where(inArray(inventoryItemMrps.id, ids));
  }

  // Codes for the variants a batch names, which doubles as the check that each of them exists
  async findVariantCodes(ids: string[]): Promise<{ id: string; code: string }[]> {
    if (ids.length === 0) return [];
    return this.db
      .select({ id: offeringVariants.id, code: offeringVariants.code })
      .from(offeringVariants)
      .where(inArray(offeringVariants.id, ids));
  }

  // Channels this listing is excluded from — absent means it is available everywhere the catalog reaches
  async findExclusions(catalogListingIds: string[]): Promise<{ catalogListingId: string; catalogChannelId: string }[]> {
    if (catalogListingIds.length === 0) return [];
    return this.db
      .select({
        catalogListingId: catalogListingChannelExclusions.catalogListingId,
        catalogChannelId: catalogListingChannelExclusions.catalogChannelId,
      })
      .from(catalogListingChannelExclusions)
      .where(inArray(catalogListingChannelExclusions.catalogListingId, catalogListingIds));
  }

  // An exclusion belongs to the channel, so the write is gated on owning the channel.
  async findChannelOwnership(channelId: string): Promise<{ id: string; isOwn: boolean } | undefined> {
    const [row] = await this.db
      .select({ id: catalogChannels.id, isOwn: ownedByWorkspaceExpression(catalogChannels) })
      .from(catalogChannels)
      .where(eq(catalogChannels.id, channelId))
      .limit(1);
    return row;
  }

  async addExclusion(catalogListingId: string, catalogChannelId: string): Promise<void> {
    await this.db
      .insert(catalogListingChannelExclusions)
      .values({ catalogListingId, catalogChannelId })
      .onConflictDoNothing();
  }

  async removeExclusion(catalogListingId: string, catalogChannelId: string): Promise<void> {
    await this.db
      .delete(catalogListingChannelExclusions)
      .where(
        and(
          eq(catalogListingChannelExclusions.catalogListingId, catalogListingId),
          eq(catalogListingChannelExclusions.catalogChannelId, catalogChannelId),
        ),
      );
  }

  // One price per (listing, currency): the narrowest workspace that set one.
  async findPrices(catalogListingIds: string[], currencyCode?: string): Promise<CatalogListingPriceRow[]> {
    if (catalogListingIds.length === 0) return [];
    return this.db
      .selectDistinctOn([catalogListingPrices.catalogListingId, catalogListingPrices.currencyCode], {
        id: catalogListingPrices.id,
        catalogListingId: catalogListingPrices.catalogListingId,
        currencyCode: catalogListingPrices.currencyCode,
        amount: catalogListingPrices.amount,
        legalEntityId: catalogListingPrices.legalEntityId,
        siteId: catalogListingPrices.siteId,
        isOwned: ownedByWorkspaceExpression(catalogListingPrices),
      })
      .from(catalogListingPrices)
      .where(
        and(
          inArray(catalogListingPrices.catalogListingId, catalogListingIds),
          currencyCode ? eq(catalogListingPrices.currencyCode, currencyCode) : undefined,
        ),
      )
      .orderBy(
        asc(catalogListingPrices.catalogListingId),
        asc(catalogListingPrices.currencyCode),
        desc(listingPriceSpecificity),
      );
  }

  // Sets this workspace's own price for a (listing, currency).
  async upsertPrice(catalogListingId: string, currencyCode: string, amount: bigint): Promise<void> {
    await this.db
      .insert(catalogListingPrices)
      .values({ catalogListingId, currencyCode, amount })
      .onConflictDoUpdate({
        target: [
          catalogListingPrices.catalogListingId,
          catalogListingPrices.currencyCode,
          catalogListingPrices.legalEntityId,
          catalogListingPrices.siteId,
        ],
        set: { amount },
      });
  }

  // Clears this workspace's own price, leaving any wider one to apply again.
  async deleteOwnPrice(catalogListingId: string, currencyCode: string): Promise<number> {
    const rows = (await this.db
      .delete(catalogListingPrices)
      .where(
        and(
          eq(catalogListingPrices.catalogListingId, catalogListingId),
          eq(catalogListingPrices.currencyCode, currencyCode),
        ),
      )
      .returning({ id: catalogListingPrices.id })) as { id: string }[];
    return rows.length;
  }
}

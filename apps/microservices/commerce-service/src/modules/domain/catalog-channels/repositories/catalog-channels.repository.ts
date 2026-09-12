import { Injectable } from '@nestjs/common';
import { MAX_PAGE_SIZE, PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, isNull, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import type { AnyPgColumn } from '@vritti/api-sdk/drizzle-pg-core';
import {
  type CatalogChannel,
  type CatalogChannelType,
  catalogChannels,
  catalogListingChannelExclusions,
  catalogListingPrices,
  catalogListings,
  catalogs,
  inventoryItemMrps,
  offeringVariants,
  ownedByWorkspace,
  posTerminals,
  uom,
} from '@/db/schema';
import type { CatalogChannelRow, ChannelItemRow } from '../dto/entity/catalog-channel.dto';

@Injectable()
export class CatalogChannelsDomainRepository extends PrimaryBaseRepository<typeof catalogChannels> {
  constructor(database: PrimaryDatabaseService) {
    super(database, catalogChannels);
  }

  private static selection() {
    return {
      id: catalogChannels.id,
      catalogId: catalogChannels.catalogId,
      catalogName: catalogs.name,
      catalogIsActive: catalogs.isActive,
      catalogTaxInclusive: catalogs.taxInclusive,
      type: catalogChannels.type,
      legalEntityId: catalogChannels.legalEntityId,
      siteId: catalogChannels.siteId,
      appId: catalogChannels.appId,
      terminalId: catalogChannels.terminalId,
      terminalName: posTerminals.name,
      isOwn: ownedByWorkspace('catalog_channels'),
      itemsTotal: sql<number>`(
        select count(*)::int from ${catalogListings} cl
        where cl.catalog_id = ${catalogChannels.catalogId} and cl.is_active
      )`,
      itemsSelling: sql<number>`(
        select count(*)::int from ${catalogListings} cl
        where cl.catalog_id = ${catalogChannels.catalogId} and cl.is_active
          and not exists (
            select 1 from ${catalogListingChannelExclusions} e
            where e.catalog_listing_id = cl.id and e.catalog_channel_id = ${catalogChannels.id}
          )
      )`,
      createdAt: catalogChannels.createdAt,
      updatedAt: catalogChannels.updatedAt,
    };
  }

  private static joins() {
    return [
      { table: catalogs, on: eq(catalogs.id, catalogChannels.catalogId) },
      { table: posTerminals, on: eq(posTerminals.id, catalogChannels.terminalId) },
    ];
  }

  // Returns paginated channels for the data table
  async findForTable(options: {
    where?: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
  }): Promise<{ result: CatalogChannelRow[]; count: number }> {
    return this.findAllAndCount<CatalogChannelRow>({
      select: CatalogChannelsDomainRepository.selection(),
      leftJoins: CatalogChannelsDomainRepository.joins(),
      ...options,
    });
  }

  // Returns one channel with its catalog and target names
  async findByIdWithMeta(id: string): Promise<CatalogChannelRow | undefined> {
    const { result } = await this.findForTable({
      where: eq(catalogChannels.id, id),
      orderBy: [asc(catalogChannels.type)],
      limit: 1,
      offset: 0,
    });
    return result[0];
  }

  // Returns the wildcard channel of every type this workspace can reach, for the landing cards
  async findWildcards(): Promise<CatalogChannelRow[]> {
    const { result } = await this.findForTable({
      where: and(isNull(catalogChannels.appId), isNull(catalogChannels.terminalId)),
      orderBy: [asc(catalogChannels.type)],
      limit: MAX_PAGE_SIZE,
      offset: 0,
    });
    return result;
  }

  // Returns every channel pointing at one catalog — the read-only tab on the catalog detail
  async findByCatalog(catalogId: string): Promise<CatalogChannelRow[]> {
    const { result } = await this.findForTable({
      where: eq(catalogChannels.catalogId, catalogId),
      orderBy: [asc(catalogChannels.type)],
      limit: MAX_PAGE_SIZE,
      offset: 0,
    });
    return result;
  }

  // Returns the wildcard channel of a type that this workspace owns, ignoring what it inherits
  async findOwnWildcard(type: CatalogChannelType): Promise<CatalogChannel | undefined> {
    const [row] = await this.db
      .select()
      .from(catalogChannels)
      .where(
        and(
          eq(catalogChannels.type, type),
          isNull(catalogChannels.appId),
          isNull(catalogChannels.terminalId),
          sql`${ownedByWorkspace('catalog_channels')}`,
        ),
      )
      .limit(1);
    return row;
  }

  // Returns every channel that could serve this context. A NULL scope column applies everywhere, so the
  // caller's own scope and the wildcards both match; the service then picks the most specific.
  async findCandidates(context: {
    type: CatalogChannelType;
    legalEntityId?: string | null;
    siteId?: string | null;
    appId?: string | null;
    terminalId?: string | null;
  }): Promise<CatalogChannelRow[]> {
    const matches = (column: AnyPgColumn, value: string | null | undefined) =>
      value ? or(isNull(column), eq(column, value)) : isNull(column);

    const { result } = await this.findForTable({
      where: and(
        eq(catalogChannels.type, context.type),
        eq(catalogs.isActive, true),
        matches(catalogChannels.legalEntityId, context.legalEntityId),
        matches(catalogChannels.siteId, context.siteId),
        matches(catalogChannels.appId, context.appId),
        matches(catalogChannels.terminalId, context.terminalId),
      ),
      orderBy: [asc(catalogChannels.createdAt)],
      limit: MAX_PAGE_SIZE,
      offset: 0,
    });
    return result;
  }

  // Returns the catalog's active listings, each flagged with whether this channel excludes it.
  // Reads from catalog_listings, so it is built on the query builder rather than findAllAndCount,
  // which is bound to catalog_channels.
  async findItemsForChannel(
    catalogId: string,
    channelId: string,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
  ): Promise<{ result: ChannelItemRow[]; count: number }> {
    const where = and(
      eq(catalogListings.catalogId, catalogId),
      eq(catalogListings.isActive, true),
      options.where,
    ) as SQL;

    const rows = this.db
      .select({
        listingId: catalogListings.id,
        offeringVariantId: catalogListings.offeringVariantId,
        sku: offeringVariants.sku,
        variantName: offeringVariants.name,
        mrpAmount: inventoryItemMrps.amount,
        mrpCurrencyCode: inventoryItemMrps.currencyCode,
        priceAmount: catalogListingPrices.amount,
        priceCurrencyCode: catalogListingPrices.currencyCode,
        sellsHere: sql<boolean>`${catalogListingChannelExclusions.id} is null`,
      })
      .from(catalogListings)
      .leftJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .leftJoin(inventoryItemMrps, eq(inventoryItemMrps.id, catalogListings.inventoryItemMrpId))
      .leftJoin(uom, eq(uom.id, inventoryItemMrps.uomId))
      .leftJoin(
        catalogListingPrices,
        and(eq(catalogListingPrices.catalogListingId, catalogListings.id), isNull(catalogListingPrices.siteId)),
      )
      .leftJoin(
        catalogListingChannelExclusions,
        and(
          eq(catalogListingChannelExclusions.catalogListingId, catalogListings.id),
          eq(catalogListingChannelExclusions.catalogChannelId, channelId),
        ),
      )
      .where(where)
      .orderBy(...options.orderBy)
      .limit(options.limit)
      .offset(options.offset);

    const total = this.db.select({ count: sql<number>`count(*)::int` }).from(catalogListings).where(where);

    const [result, [{ count }]] = await Promise.all([rows, total]);
    return { result: result as ChannelItemRow[], count };
  }

  // Returns the listing if it belongs to the given catalog
  async findListingInCatalog(listingId: string, catalogId: string) {
    const [row] = await this.db
      .select({ id: catalogListings.id })
      .from(catalogListings)
      .where(and(eq(catalogListings.id, listingId), eq(catalogListings.catalogId, catalogId)))
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

  // Returns the catalog a channel points at, for the resolve response
  async findCatalog(catalogId: string) {
    const [row] = await this.db
      .select({ id: catalogs.id, name: catalogs.name, taxInclusive: catalogs.taxInclusive })
      .from(catalogs)
      .where(eq(catalogs.id, catalogId))
      .limit(1);
    return row;
  }

  async countForCatalog(catalogId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(catalogChannels)
      .where(eq(catalogChannels.catalogId, catalogId));
    return row?.count ?? 0;
  }
}

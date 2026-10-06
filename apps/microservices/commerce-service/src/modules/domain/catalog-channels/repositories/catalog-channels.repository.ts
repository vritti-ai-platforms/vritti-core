import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, inArray, isNull, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import type { AnyPgColumn } from '@vritti/api-sdk/drizzle-pg-core';
import {
  type CatalogChannel,
  type CatalogChannelType,
  catalogChannels,
  catalogListingChannelExclusions,
  catalogListingPrices,
  catalogListings,
  catalogs,
  channelSpecificity,
  inventoryItemMrps,
  offeringVariants,
  ownedByWorkspaceExpression,
  posTerminals,
  SITE_GUC,
  uom,
} from '@/db/schema';
import type { CatalogChannelRow, ChannelItemRow, ChannelListRow } from '../dto/entity/catalog-channel.dto';
import type { StorefrontListingRow } from '../dto/entity/storefront-listing.dto';

// A row's target, or null when it is a default. Groups every default of a type together, so one
// DISTINCT ON resolves the default and each named target in the same pass.
const targetKey = sql`coalesce(${catalogChannels.appId}, ${catalogChannels.terminalId})`;

export interface ChannelTarget {
  type: CatalogChannelType;
  catalogId: string;
  appId: string | null;
  terminalId: string | null;
}

export interface StorefrontChannel {
  id: string;
  catalogId: string;
}

@Injectable()
export class CatalogChannelsDomainRepository extends PrimaryBaseRepository<typeof catalogChannels> {
  constructor(database: PrimaryDatabaseService) {
    super(database, catalogChannels);
  }

  // Each read selects what it shows. A correlated subquery runs once per returned row, so the two
  // item counts only the list renders would be computed and thrown away on every other read.
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
      isOwn: ownedByWorkspaceExpression('catalog_channels'),
      createdAt: catalogChannels.createdAt,
      updatedAt: catalogChannels.updatedAt,
    };
  }

  // catalog_id is NOT NULL with an FK, so this drops nothing — it only lets the row type say so
  // Only the channels list prints "x of y items", so only it pays for the two counts
  private static listSelection() {
    return {
      ...CatalogChannelsDomainRepository.selection(),
      itemsTotal: sql<number>`(
        select count(*)::int from ${catalogListings}
        join ${offeringVariants} on ${offeringVariants.id} = ${catalogListings.offeringVariantId}
        where ${catalogListings.catalogId} = ${catalogChannels.catalogId}
          and ${offeringVariants.isActive} and ${offeringVariants.isOfferingActive}
      )`,
      itemsSelling: sql<number>`(
        select count(*)::int from ${catalogListings}
        join ${offeringVariants} on ${offeringVariants.id} = ${catalogListings.offeringVariantId}
        where ${catalogListings.catalogId} = ${catalogChannels.catalogId}
          and ${offeringVariants.isActive} and ${offeringVariants.isOfferingActive}
          and not exists (
            select 1 from ${catalogListingChannelExclusions}
            where ${catalogListingChannelExclusions.catalogListingId} = ${catalogListings.id}
              and ${catalogListingChannelExclusions.catalogChannelId} = ${catalogChannels.id}
          )
      )`,
    };
  }

  private static innerJoins() {
    return [{ table: catalogs, on: eq(catalogs.id, catalogChannels.catalogId) }];
  }

  // terminal_id is null on every App and B2B channel and on a POS default, so those rows must survive
  private static leftJoins() {
    return [{ table: posTerminals, on: eq(posTerminals.id, catalogChannels.terminalId) }];
  }

  // Returns one channel with its catalog and target names
  async findByIdWithMeta(id: string): Promise<CatalogChannelRow | undefined> {
    const [row] = await this.findAllWithSelect<CatalogChannelRow>({
      select: CatalogChannelsDomainRepository.selection(),
      innerJoins: CatalogChannelsDomainRepository.innerJoins(),
      leftJoins: CatalogChannelsDomainRepository.leftJoins(),
      where: eq(catalogChannels.id, id),
      orderBy: [asc(catalogChannels.type)],
    });
    return row;
  }

  // The winning row for every slot this workspace can see — each type's default, and each app or terminal that overrides it
  async findResolved(): Promise<ChannelListRow[]> {
    const rows = await this.db
      .selectDistinctOn([catalogChannels.type, targetKey], CatalogChannelsDomainRepository.listSelection())
      .from(catalogChannels)
      .innerJoin(catalogs, eq(catalogs.id, catalogChannels.catalogId))
      .leftJoin(posTerminals, eq(posTerminals.id, catalogChannels.terminalId))
      .orderBy(catalogChannels.type, targetKey, desc(channelSpecificity));
    return rows as ChannelListRow[];
  }

  // Whether any workspace in reach has set this type's default. RLS bounds it to this workspace and
  // its ancestors, which is exactly the set a named target would fall back to.
  async hasDefaultInReach(type: CatalogChannelType): Promise<boolean> {
    const [row] = await this.db
      .select({ one: sql`1` })
      .from(catalogChannels)
      .where(and(eq(catalogChannels.type, type), isNull(catalogChannels.appId), isNull(catalogChannels.terminalId)))
      .limit(1);
    return Boolean(row);
  }

  // Returns the channel this workspace owns for exactly this target, ignoring what it inherits. A null
  // target column means the wildcard, so it must be matched as NULL rather than skipped — otherwise a
  // named app would collide with the fallback.
  async findOwnChannel(target: ChannelTarget): Promise<CatalogChannel | undefined> {
    const is = (column: AnyPgColumn, value: string | null) => (value ? eq(column, value) : isNull(column));

    const [row] = await this.db
      .select()
      .from(catalogChannels)
      .where(
        and(
          eq(catalogChannels.type, target.type),
          is(catalogChannels.appId, target.appId),
          is(catalogChannels.terminalId, target.terminalId),
          sql`${ownedByWorkspaceExpression('catalog_channels')}`,
        ),
      )
      .limit(1);
    return row;
  }

  // The one row that serves the calling workspace, already ranked
  async resolveCatalogChannel(context: {
    type: CatalogChannelType;
    appId?: string | null;
    terminalId?: string | null;
  }): Promise<CatalogChannelRow | undefined> {
    const matches = (column: AnyPgColumn, value: string | null | undefined) =>
      value ? or(isNull(column), eq(column, value)) : isNull(column);

    const [row] = await this.db
      .select(CatalogChannelsDomainRepository.selection())
      .from(catalogChannels)
      .innerJoin(catalogs, eq(catalogs.id, catalogChannels.catalogId))
      .leftJoin(posTerminals, eq(posTerminals.id, catalogChannels.terminalId))
      .where(
        and(
          eq(catalogChannels.type, context.type),
          matches(catalogChannels.appId, context.appId),
          matches(catalogChannels.terminalId, context.terminalId),
        ),
      )
      .orderBy(desc(channelSpecificity))
      .limit(1);
    return row as CatalogChannelRow | undefined;
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
      eq(offeringVariants.isActive, true),
      eq(offeringVariants.isOfferingActive, true),
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

    // Shares `where` with the rows query, so it needs the same variant join — the active flags and
    // every sortable/filterable item column live on offering_variants, not on catalog_listings
    const total = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(catalogListings)
      .leftJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .where(where);

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

  // Limits a read to a live variant on a live offering that this channel does not exclude
  private sellable(channelId: string): SQL {
    return and(
      eq(offeringVariants.isActive, true),
      eq(offeringVariants.isOfferingActive, true),
      sql`not exists (
        select 1 from ${catalogListingChannelExclusions}
        where ${catalogListingChannelExclusions.catalogListingId} = ${catalogListings.id}
          and ${catalogListingChannelExclusions.catalogChannelId} = ${channelId}
      )`,
    ) as SQL;
  }

  // Returns a site's own price, falling back to the organization-wide row
  private static priceColumn(column: AnyPgColumn) {
    return sql<string | null>`(
      select ${column} from ${catalogListingPrices}
      where ${catalogListingPrices.catalogListingId} = ${catalogListings.id}
        and (${catalogListingPrices.siteId} = ${sql.raw(SITE_GUC)} or ${catalogListingPrices.siteId} is null)
      order by ${catalogListingPrices.siteId} asc nulls last, ${catalogListingPrices.currencyCode} asc
      limit 1
    )`;
  }

  private static listingSelection() {
    return {
      id: catalogListings.id,
      offeringVariantId: catalogListings.offeringVariantId,
      sku: offeringVariants.sku,
      name: offeringVariants.name,
      priceCurrency: CatalogChannelsDomainRepository.priceColumn(catalogListingPrices.currencyCode),
      priceAmount: CatalogChannelsDomainRepository.priceColumn(catalogListingPrices.amount),
    };
  }

  // Returns everything the resolved channel's catalog sells, at this workspace's price
  findListings(channel: StorefrontChannel): Promise<StorefrontListingRow[]> {
    return this.db
      .select(CatalogChannelsDomainRepository.listingSelection())
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .where(and(eq(catalogListings.catalogId, channel.catalogId), this.sellable(channel.id)) as SQL)
      .orderBy(asc(offeringVariants.sku));
  }

  // Prices variants the caller already holds — a basket or wishlist reconciling stored rows
  async findListingsByVariants(channel: StorefrontChannel, variantIds: string[]): Promise<StorefrontListingRow[]> {
    // `inArray` with an empty list is a SQL error in some dialects and an always-false in others;
    // neither is worth a round trip when the caller already told us it wants nothing.
    if (!variantIds.length) return [];

    return this.db
      .select(CatalogChannelsDomainRepository.listingSelection())
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .where(
        and(
          eq(catalogListings.catalogId, channel.catalogId),
          this.sellable(channel.id),
          inArray(catalogListings.offeringVariantId, variantIds),
        ) as SQL,
      )
      .orderBy(asc(offeringVariants.sku));
  }

  // Returns the catalog a channel points at, for the resolve response
  async findCatalog(catalogId: string) {
    const [row] = await this.db
      .select({
        id: catalogs.id,
        name: catalogs.name,
        taxInclusive: catalogs.taxInclusive,
        legalEntityId: catalogs.legalEntityId,
        siteId: catalogs.siteId,
      })
      .from(catalogs)
      .where(eq(catalogs.id, catalogId))
      .limit(1);
    return row;
  }
}

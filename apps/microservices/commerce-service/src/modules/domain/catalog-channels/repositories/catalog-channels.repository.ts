import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, inArray, isNull, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import type { AnyPgColumn } from '@vritti/api-sdk/drizzle-pg-core';
import {
  type CatalogChannel,
  type CatalogChannelType,
  CatalogChannelTypeValues,
  catalogChannels,
  catalogListingChannelExclusions,
  catalogListingPrices,
  catalogListings,
  catalogs,
  inventoryItemMrps,
  offeringVariants,
  ownedByWorkspaceExpression,
  posTerminals,
  uom,
} from '@/db/schema';
import type { CatalogChannelRow, ChannelItemRow, ChannelListRow } from '../dto/entity/catalog-channel.dto';
import type { StorefrontListingRow } from '../dto/entity/storefront-listing.dto';

// A row's target, or null when it is a default. Groups every default of a type together, so one
// DISTINCT ON resolves the default and each named target in the same pass.
const targetKey = sql`coalesce(${catalogChannels.appId}, ${catalogChannels.terminalId})`;

/**
 * How strongly a row claims a caller. Highest wins.
 *
 * Naming an app or terminal is a deliberate exception, so it outranks any workspace — the most a
 * workspace alone can score is 4 + 2. Below that the narrower workspace wins, and the organization
 * scores zero as the fallback everything beats. The one definition both the list and resolve rank by.
 */
const specificity = sql`
  (case when ${catalogChannels.appId} is not null or ${catalogChannels.terminalId} is not null then 8 else 0 end)
  + (case when ${catalogChannels.siteId} is not null then 4 else 0 end)
  + (case when ${catalogChannels.legalEntityId} is not null then 2 else 0 end)`;

export interface ChannelTarget {
  type: CatalogChannelType;
  catalogId: string;
  appId: string | null;
  terminalId: string | null;
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
        select count(*)::int from ${catalogListings} cl
        join ${offeringVariants} ov on ov.id = cl.offering_variant_id
        where cl.catalog_id = ${catalogChannels}.catalog_id and ov.is_active and ov.is_offering_active
      )`,
      itemsSelling: sql<number>`(
        select count(*)::int from ${catalogListings} cl
        join ${offeringVariants} ov on ov.id = cl.offering_variant_id
        where cl.catalog_id = ${catalogChannels}.catalog_id and ov.is_active and ov.is_offering_active
          and not exists (
            select 1 from ${catalogListingChannelExclusions} e
            where e.catalog_listing_id = cl.id and e.catalog_channel_id = ${catalogChannels}.id
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

  /**
   * The winning row for every slot this workspace can see — each type's default, and each app or
   * terminal that overrides it.
   *
   * DISTINCT ON does the ranking, so nothing downstream compares rows: the defaults of a type share a
   * null target key and collapse to the most specific one, and every named target keeps its own.
   * Scope is not a filter — RLS bounds this to the workspace and its ancestors.
   */
  async findResolved(): Promise<ChannelListRow[]> {
    const rows = await this.db
      .selectDistinctOn([catalogChannels.type, targetKey], CatalogChannelsDomainRepository.listSelection())
      .from(catalogChannels)
      .innerJoin(catalogs, eq(catalogs.id, catalogChannels.catalogId))
      .leftJoin(posTerminals, eq(posTerminals.id, catalogChannels.terminalId))
      .orderBy(catalogChannels.type, targetKey, desc(specificity));
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

  /**
   * The one row that serves the calling workspace, already ranked.
   *
   * **Which workspace is not an argument.** `workspaceScopePolicies` on `catalog_channels` already
   * limits this read to the channels the request's own workspace can see — org-owned, its own LE's,
   * its own site's — and that workspace is the RLS context, derived on the server: a site request's
   * legal entity is resolved from the site, never taken from the client. Filtering on a site or LE id
   * here as well only repeated that, and got it wrong: a NULL "don't care" compiled to `IS NULL` and
   * hid every channel the site or its LE owned.
   *
   * What RLS cannot know is which *door* the caller is — which storefront app, which till — so those
   * two stay: a NULL app or terminal applies everywhere, a named one only to itself.
   */
  async findWinningCandidate(context: {
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
          eq(catalogs.isActive, true),
          matches(catalogChannels.appId, context.appId),
          matches(catalogChannels.terminalId, context.terminalId),
        ),
      )
      .orderBy(desc(specificity))
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

  /**
   * A storefront's whole range in one query: the APP channel this credential resolves to, the
   * listings of the catalog it points at, each with the price that applies in this workspace.
   *
   * Resolved and joined here rather than fetched in steps, so a storefront read is one round trip
   * and cannot see a catalog its channel does not point at — the catalog id is never an argument.
   */
  async findAppListings(appId: string, variantIds?: string[]): Promise<StorefrontListingRow[]> {
    const channel = this.db
      .select({ id: catalogChannels.id, catalogId: catalogChannels.catalogId })
      .from(catalogChannels)
      .where(
        and(
          eq(catalogChannels.type, CatalogChannelTypeValues.APP),
          or(eq(catalogChannels.appId, appId), isNull(catalogChannels.appId)),
        ),
      )
      .orderBy(desc(specificity))
      .limit(1)
      .as('channel');

    // A site's own price wins over the organization-wide row; nulls last puts the site row first
    const priceColumn = (column: 'currency_code' | 'amount') => sql<string | null>`(
      select p.${sql.raw(column)} from ${catalogListingPrices} p
      where p.catalog_listing_id = ${catalogListings}.id
        and (p.site_id = cast(nullif(current_setting('app.site_id', true), '') as uuid) or p.site_id is null)
      order by p.site_id asc nulls last, p.currency_code asc
      limit 1
    )`;

    return this.db
      .select({
        id: catalogListings.id,
        offeringVariantId: catalogListings.offeringVariantId,
        sku: offeringVariants.sku,
        name: offeringVariants.name,
        priceCurrency: priceColumn('currency_code'),
        priceAmount: priceColumn('amount'),
      })
      .from(catalogListings)
      .innerJoin(channel, eq(channel.catalogId, catalogListings.catalogId))
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .where(
        and(
          eq(offeringVariants.isActive, true),
          eq(offeringVariants.isOfferingActive, true),
          variantIds?.length ? inArray(catalogListings.offeringVariantId, variantIds) : undefined,
          sql`not exists (
            select 1 from ${catalogListingChannelExclusions} e
            where e.catalog_listing_id = ${catalogListings}.id and e.catalog_channel_id = ${channel.id}
          )`,
        ),
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

  async countForCatalog(catalogId: string): Promise<number> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(catalogChannels)
      .where(eq(catalogChannels.catalogId, catalogId));
    return row?.count ?? 0;
  }
}

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, inArray, isNull, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import type { AnyPgColumn } from '@vritti/api-sdk/drizzle-pg-core';
import {
  type CatalogChannel,
  type CatalogChannelType,
  type CatalogFilterMode,
  catalogChannels,
  catalogListingChannelExclusions,
  catalogListingPrices,
  catalogListings,
  catalogs,
  channelSpecificity,
  inventoryItemMrps,
  offeringAttributes,
  offeringAttributeValues,
  offeringDimensions,
  offeringDimensionValues,
  offeringVariantAttributeValues,
  offeringVariants,
  offeringVariantValues,
  ownedByWorkspaceExpression,
  posTerminals,
  SITE_GUC,
  uom,
} from '@/db/schema';
import type { CatalogChannelRow, ChannelItemRow, ChannelListRow } from '../dto/entity/catalog-channel.dto';
import type { ListingFilterRow } from '../dto/entity/listing-filter.dto';
import type { StorefrontListingRow } from '../dto/entity/storefront-listing.dto';
import { type ListingSort, ListingSortValues } from '../dto/request/listing-query.dto';

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
  filterMode: CatalogFilterMode;
}

// One selected filter group. The code may name a dimension or an attribute; `filterPredicate` tries
// both rather than making the caller know which, because a storefront URL carries only codes.
export interface ListingFilterSelection {
  code: string;
  values: string[];
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
      catalogFilterMode: catalogs.filterMode,
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

  // One selected group, matched against whichever junction its code lives in. A storefront URL carries
  // codes only, so the kind is discovered here rather than declared: the two EXISTS are ORed, and
  // because a code is unique per offering within each kind, at most one of them can match.
  private static filterPredicate(selection: ListingFilterSelection): SQL {
    // Spelled out with sql.join rather than handed the array: Drizzle expands a JS array inside a
    // template into a parenthesised placeholder LIST — `any(($2, $3))` — which is a row constructor,
    // not an array, and Postgres rejects it. An IN list is what was meant and what this builds.
    const values = sql.join(
      selection.values.map((value) => sql`${value}`),
      sql`, `,
    );

    return sql`(
      exists (
        select 1 from ${offeringVariantValues} ovv
          join ${offeringDimensions} d on d.id = ovv.dimension_id
          join ${offeringDimensionValues} dv on dv.id = ovv.value_id
        where ovv.variant_id = ${offeringVariants.id}
          and d.code = ${selection.code}
          and dv.code in (${values})
      )
      or exists (
        select 1 from ${offeringVariantAttributeValues} ova
          join ${offeringAttributes} a on a.id = ova.attribute_id
          join ${offeringAttributeValues} av on av.id = ova.value_id
        where ova.variant_id = ${offeringVariants.id}
          and a.code = ${selection.code}
          and av.code in (${values})
      )
    )`;
  }

  // AND across groups, OR within one. One EXISTS per group rather than a HAVING over a join, which
  // would miscount the moment a variant carries two values of the same group.
  static filtersWhere(selections: ListingFilterSelection[]): SQL | undefined {
    const predicates = selections
      .filter((selection) => selection.values.length > 0)
      .map((selection) => CatalogChannelsDomainRepository.filterPredicate(selection));
    return predicates.length ? (and(...predicates) as SQL) : undefined;
  }

  // Price is a correlated subquery, so it cannot be named in ORDER BY — it is spelled out again here.
  // Every branch ends in `id asc`: without a unique tiebreak two rows that tie can swap between pages
  // and a shopper sees one product twice and another never.
  private static orderBy(sort: ListingSort): SQL[] {
    const price = CatalogChannelsDomainRepository.priceColumn(catalogListingPrices.amount);
    switch (sort) {
      case ListingSortValues.PRICE_ASC:
        return [sql`${price} asc nulls last`, asc(catalogListings.id)];
      case ListingSortValues.PRICE_DESC:
        return [sql`${price} desc nulls last`, asc(catalogListings.id)];
      case ListingSortValues.NEWEST:
        return [desc(catalogListings.createdAt), asc(catalogListings.id)];
      default:
        return [asc(offeringVariants.sku), asc(catalogListings.id)];
    }
  }

  // One page of what the resolved channel's catalog sells, at this workspace's price, plus the
  // unfiltered-by-page total the pager needs
  async findListings(
    channel: StorefrontChannel,
    query: { filters: ListingFilterSelection[]; page: number; perPage: number; sort: ListingSort },
  ): Promise<{ rows: StorefrontListingRow[]; total: number }> {
    const where = and(
      eq(catalogListings.catalogId, channel.catalogId),
      this.sellable(channel.id),
      CatalogChannelsDomainRepository.filtersWhere(query.filters),
    ) as SQL;

    const rows = this.db
      .select(CatalogChannelsDomainRepository.listingSelection())
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .where(where)
      .orderBy(...CatalogChannelsDomainRepository.orderBy(query.sort))
      .limit(query.perPage)
      .offset((query.page - 1) * query.perPage);

    // Shares `where` with the rows query, so it needs the same variant join — the active flags the
    // sellable predicate reads live on offering_variants, not on catalog_listings
    const count = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .where(where);

    const [result, [{ count: total }]] = await Promise.all([rows, count]);
    return { rows: result, total };
  }

  // One listing by the variant it is for, in the resolved channel's catalog. The variant id is what a
  // storefront stores against its own product row, so this is the detail page's read.
  async findListingByVariant(channel: StorefrontChannel, variantId: string): Promise<StorefrontListingRow | undefined> {
    const [row] = await this.db
      .select(CatalogChannelsDomainRepository.listingSelection())
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .where(
        and(
          eq(catalogListings.catalogId, channel.catalogId),
          this.sellable(channel.id),
          eq(catalogListings.offeringVariantId, variantId),
        ) as SQL,
      )
      .limit(1);
    return row;
  }

  // The dimension groups present on the listings this channel sells, with a count per value.
  //
  // Walked from the variants in the catalog rather than from the offerings' declared dimensions: an
  // offering may declare six flavours while only two are on variants that reach here, and offering
  // the other four would be offering a click that returns nothing.
  //
  // Grouped by code across offerings, because a dimension row belongs to one offering —
  // unique(offering_id, code) — so a catalog of 47 products can hold 40 separate "Flavour" rows.
  // The heading is picked deterministically rather than left to whichever row the planner reached
  // first, since two offerings can spell one code's name differently.
  findListingDimensions(channel: StorefrontChannel, where?: SQL): Promise<ListingFilterRow[]> {
    return this.db
      .select({
        code: offeringDimensions.code,
        name: sql<string>`(array_agg(${offeringDimensions.name} order by ${offeringDimensions.sortOrder}, ${offeringDimensions.id}))[1]`,
        sortOrder: sql<number>`min(${offeringDimensions.sortOrder})::int`,
        valueCode: offeringDimensionValues.code,
        valueName: sql<string>`(array_agg(${offeringDimensionValues.value} order by ${offeringDimensionValues.sortOrder}, ${offeringDimensionValues.id}))[1]`,
        valueSortOrder: sql<number>`min(${offeringDimensionValues.sortOrder})::int`,
        count: sql<number>`count(distinct ${catalogListings.id})::int`,
      })
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .innerJoin(offeringVariantValues, eq(offeringVariantValues.variantId, offeringVariants.id))
      .innerJoin(offeringDimensions, eq(offeringDimensions.id, offeringVariantValues.dimensionId))
      .innerJoin(offeringDimensionValues, eq(offeringDimensionValues.id, offeringVariantValues.valueId))
      .where(and(eq(catalogListings.catalogId, channel.catalogId), this.sellable(channel.id), where) as SQL)
      .groupBy(offeringDimensions.code, offeringDimensionValues.code)
      .orderBy(
        sql`min(${offeringDimensions.sortOrder})`,
        offeringDimensions.code,
        sql`min(${offeringDimensionValues.sortOrder})`,
        offeringDimensionValues.code,
      );
  }

  // The attribute groups, same shape and same grouping rule. Separate from dimensions because they
  // hang off a different junction; the service concatenates them into one rail.
  findListingAttributes(channel: StorefrontChannel, where?: SQL): Promise<ListingFilterRow[]> {
    return this.db
      .select({
        code: offeringAttributes.code,
        name: sql<string>`(array_agg(${offeringAttributes.name} order by ${offeringAttributes.sortOrder}, ${offeringAttributes.id}))[1]`,
        sortOrder: sql<number>`min(${offeringAttributes.sortOrder})::int`,
        valueCode: offeringAttributeValues.code,
        valueName: sql<string>`(array_agg(${offeringAttributeValues.value} order by ${offeringAttributeValues.sortOrder}, ${offeringAttributeValues.id}))[1]`,
        valueSortOrder: sql<number>`min(${offeringAttributeValues.sortOrder})::int`,
        count: sql<number>`count(distinct ${catalogListings.id})::int`,
      })
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .innerJoin(offeringVariantAttributeValues, eq(offeringVariantAttributeValues.variantId, offeringVariants.id))
      .innerJoin(offeringAttributes, eq(offeringAttributes.id, offeringVariantAttributeValues.attributeId))
      .innerJoin(offeringAttributeValues, eq(offeringAttributeValues.id, offeringVariantAttributeValues.valueId))
      .where(and(eq(catalogListings.catalogId, channel.catalogId), this.sellable(channel.id), where) as SQL)
      .groupBy(offeringAttributes.code, offeringAttributeValues.code)
      .orderBy(
        sql`min(${offeringAttributes.sortOrder})`,
        offeringAttributes.code,
        sql`min(${offeringAttributeValues.sortOrder})`,
        offeringAttributeValues.code,
      );
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

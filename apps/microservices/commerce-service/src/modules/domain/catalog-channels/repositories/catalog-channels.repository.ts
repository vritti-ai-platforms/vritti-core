import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, desc, eq, inArray, isNull, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import type { AnyPgColumn } from '@vritti/api-sdk/drizzle-pg-core';
import {
  type CatalogChannel,
  type CatalogChannelType,
  type CatalogFilterMode,
  catalogChannels,
  catalogCurrencies,
  catalogListingChannelExclusions,
  catalogListingPrices,
  catalogListings,
  catalogs,
  channelSpecificity,
  inventoryItemMrps,
  listingPriceSpecificity,
  offeringAttributes,
  offeringAttributeValues,
  offeringDimensions,
  offeringDimensionValues,
  offerings,
  offeringVariantAttributeValues,
  offeringVariants,
  offeringVariantValues,
  ownedByWorkspaceExpression,
  posTerminals,
  uom,
} from '@/db/schema';
import type {
  CatalogChannelRow,
  ChannelItemRow,
  ChannelListRow,
  ChannelPriceRow,
} from '../dto/entity/catalog-channel.dto';
import type { ListingFilterRow } from '../dto/entity/listing-filter.dto';
import type { StorefrontListingRow } from '../dto/entity/storefront-listing.dto';
import { type ListingSort, ListingSortValues } from '../dto/request/listing-query.dto';

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
  catalogFilterMode: CatalogFilterMode;
}

export interface VariantSiblingRow {
  variantId: string;
  code: string;
  dimensionCode: string;
  dimensionName: string;
  dimensionSortOrder: number;
  valueCode: string;
  valueName: string;
  valueSortOrder: number;
}

export interface ListingFilterSelection {
  code: string;
  values: string[];
}

@Injectable()
export class CatalogChannelsDomainRepository extends PrimaryBaseRepository<typeof catalogChannels> {
  constructor(database: PrimaryDatabaseService) {
    super(database, catalogChannels);
  }

  // Each read selects what it shows.
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
      isOwn: ownedByWorkspaceExpression(catalogChannels),
      createdAt: catalogChannels.createdAt,
      updatedAt: catalogChannels.updatedAt,
    };
  }

  // catalog_id is NOT NULL with an FK, so this drops nothing — it only lets the row type say so Only the channels list
  // prints "x of y items", so only it pays for the two counts
  private static listSelection() {
    return {
      ...CatalogChannelsDomainRepository.selection(),
      itemsTotal: sql<number>`(
        select count(*)::int from ${catalogListings}
        join ${offeringVariants} on ${offeringVariants.id} = ${catalogListings.offeringVariantId}
        where ${catalogListings.catalogId} = ${catalogChannels.catalogId}
          and ${offeringVariants.isActive} and ${offeringVariants.isOfferingActive}
      )`,
      itemsAvailable: sql<number>`(
        select count(*)::int from ${catalogListings}
        join ${offeringVariants} on ${offeringVariants.id} = ${catalogListings.offeringVariantId}
        where ${catalogListings.catalogId} = ${catalogChannels.catalogId}
          and ${offeringVariants.isActive} and ${offeringVariants.isOfferingActive}
          and not exists (
            select 1 from ${catalogListingChannelExclusions}
            where ${catalogListingChannelExclusions.catalogListingId} = ${catalogListings.id}
              and ${catalogListingChannelExclusions.catalogChannelId} = ${catalogChannels.id}
              -- Excluded outright. One excluded from a single currency is still available in the others,
              -- so it counts here — the card says what the channel carries, not what it quotes
              and ${catalogListingChannelExclusions.currencyCode} is null
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

  // The winning row for every slot this workspace can see — each type's default, and each override of it
  async findResolved(): Promise<ChannelListRow[]> {
    const rows = await this.db
      .selectDistinctOn([catalogChannels.type, targetKey], CatalogChannelsDomainRepository.listSelection())
      .from(catalogChannels)
      .innerJoin(catalogs, eq(catalogs.id, catalogChannels.catalogId))
      .leftJoin(posTerminals, eq(posTerminals.id, catalogChannels.terminalId))
      .orderBy(catalogChannels.type, targetKey, desc(channelSpecificity));
    return rows as ChannelListRow[];
  }

  // Whether any workspace in reach has set this type's default.
  async hasDefaultInReach(type: CatalogChannelType): Promise<boolean> {
    const [row] = await this.db
      .select({ one: sql`1` })
      .from(catalogChannels)
      .where(and(eq(catalogChannels.type, type), isNull(catalogChannels.appId), isNull(catalogChannels.terminalId)))
      .limit(1);
    return Boolean(row);
  }

  // Returns the channel this workspace owns for exactly this target, ignoring what it inherits.
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
          sql`${ownedByWorkspaceExpression(catalogChannels)}`,
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

  // Returns the catalog's active listings, each flagged with whether this channel carries it at all.
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
        code: offeringVariants.code,
        offeringName: offerings.name,
        dimensions: offeringVariants.dimensions,
        attributes: offeringVariants.attributes,
        mrpAmount: inventoryItemMrps.amount,
        mrpCurrencyCode: inventoryItemMrps.currencyCode,
        // Only an outright exclusion answers this; one naming a currency is shown on the Prices tab
        availableHere: sql<boolean>`not exists (
          select 1 from ${catalogListingChannelExclusions}
          where ${catalogListingChannelExclusions.catalogListingId} = ${catalogListings.id}
            and ${catalogListingChannelExclusions.catalogChannelId} = ${channelId}
            and ${catalogListingChannelExclusions.currencyCode} is null
        )`,
        availableCurrencyCodes: sql<string[]>`coalesce((
          select array_agg(${catalogCurrencies.currencyCode} order by ${catalogCurrencies.sortOrder}, ${catalogCurrencies.currencyCode})
          from ${catalogCurrencies}
          where ${catalogCurrencies.catalogId} = ${catalogId}
            and exists (
              select 1 from ${catalogListingPrices}
              where ${catalogListingPrices.catalogListingId} = ${catalogListings.id}
                and ${catalogListingPrices.currencyCode} = ${catalogCurrencies.currencyCode}
            )
            and not exists (
              select 1 from ${catalogListingChannelExclusions}
              where ${catalogListingChannelExclusions.catalogListingId} = ${catalogListings.id}
                and ${catalogListingChannelExclusions.catalogChannelId} = ${channelId}
                and (${catalogListingChannelExclusions.currencyCode} is null
                     or ${catalogListingChannelExclusions.currencyCode} = ${catalogCurrencies.currencyCode})
            )
        ), '{}')`,
      })
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .leftJoin(inventoryItemMrps, eq(inventoryItemMrps.id, catalogListings.inventoryItemMrpId))
      .leftJoin(uom, eq(uom.id, inventoryItemMrps.uomId))
      .where(where)
      .orderBy(...options.orderBy)
      .limit(options.limit)
      .offset(options.offset);

    const total = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .where(where);

    const [result, [{ count }]] = await Promise.all([rows, total]);
    return { result: result as ChannelItemRow[], count };
  }

  // What this channel charges in one currency, and whether it is available there at that price.
  async findPricesForChannel(
    catalogId: string,
    channelId: string,
    currencyCode: string,
    options: { where?: SQL; orderBy: SQL[]; limit: number; offset: number },
  ): Promise<{ result: ChannelPriceRow[]; count: number }> {
    const where = and(
      eq(catalogListings.catalogId, catalogId),
      eq(offeringVariants.isActive, true),
      eq(offeringVariants.isOfferingActive, true),
      options.where,
    ) as SQL;
    const price = this.priceLateral(currencyCode);

    const rows = this.db
      .select({
        listingId: catalogListings.id,
        offeringVariantId: catalogListings.offeringVariantId,
        code: offeringVariants.code,
        offeringName: offerings.name,
        dimensions: offeringVariants.dimensions,
        attributes: offeringVariants.attributes,
        mrpAmount: inventoryItemMrps.amount,
        mrpCurrencyCode: inventoryItemMrps.currencyCode,
        priceAmount: price.amount,
        priceCurrencyCode: price.currencyCode,
        priceLegalEntityId: price.legalEntityId,
        priceSiteId: price.siteId,
        // Both exclusions bite here: excluded outright, or excluded from this currency
        availableHere: sql<boolean>`not exists (
          select 1 from ${catalogListingChannelExclusions}
          where ${catalogListingChannelExclusions.catalogListingId} = ${catalogListings.id}
            and ${catalogListingChannelExclusions.catalogChannelId} = ${channelId}
            and (${catalogListingChannelExclusions.currencyCode} is null
                 or ${catalogListingChannelExclusions.currencyCode} = ${currencyCode})
        )`,
        // Apart so the switch can say WHY it is off, and refuse to be flipped on where it would not help
        excludedOutright: sql<boolean>`exists (
          select 1 from ${catalogListingChannelExclusions}
          where ${catalogListingChannelExclusions.catalogListingId} = ${catalogListings.id}
            and ${catalogListingChannelExclusions.catalogChannelId} = ${channelId}
            and ${catalogListingChannelExclusions.currencyCode} is null
        )`,
      })
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .leftJoin(inventoryItemMrps, eq(inventoryItemMrps.id, catalogListings.inventoryItemMrpId))
      .leftJoin(uom, eq(uom.id, inventoryItemMrps.uomId))
      .leftJoinLateral(price, sql`true`)
      .where(where)
      .orderBy(...options.orderBy)
      .limit(options.limit)
      .offset(options.offset);

    const total = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .where(where);

    const [result, [{ count }]] = await Promise.all([rows, total]);
    return { result: result as ChannelPriceRow[], count };
  }

  async findListingInCatalog(listingId: string, catalogId: string) {
    const [row] = await this.db
      .select({ id: catalogListings.id, code: offeringVariants.code })
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .where(and(eq(catalogListings.id, listingId), eq(catalogListings.catalogId, catalogId)))
      .limit(1);
    return row;
  }

  // A null currency excludes the listing outright, a code excludes it from that currency only.
  async addExclusion(catalogListingId: string, catalogChannelId: string, currencyCode: string | null): Promise<void> {
    await this.db
      .insert(catalogListingChannelExclusions)
      .values({ catalogListingId, catalogChannelId, currencyCode })
      .onConflictDoNothing({
        target: [
          catalogListingChannelExclusions.catalogListingId,
          catalogListingChannelExclusions.catalogChannelId,
          catalogListingChannelExclusions.currencyCode,
        ],
      });
  }

  // Lifting one currency's exclusion leaves an outright one in place, and lifting the outright one leaves the
  // per-currency ones — each switch owns exactly its own row.
  async removeExclusion(
    catalogListingId: string,
    catalogChannelId: string,
    currencyCode: string | null,
  ): Promise<void> {
    await this.db
      .delete(catalogListingChannelExclusions)
      .where(
        and(
          eq(catalogListingChannelExclusions.catalogListingId, catalogListingId),
          eq(catalogListingChannelExclusions.catalogChannelId, catalogChannelId),
          currencyCode
            ? eq(catalogListingChannelExclusions.currencyCode, currencyCode)
            : isNull(catalogListingChannelExclusions.currencyCode),
        ),
      );
  }

  // Limits a read to a live variant on a live offering that this channel does not exclude.
  private availableOnChannel(channelId: string, currencyCode?: string): SQL {
    const inThisCurrency = currencyCode
      ? sql`and (${catalogListingChannelExclusions.currencyCode} is null
                 or ${catalogListingChannelExclusions.currencyCode} = ${currencyCode})`
      : sql`and ${catalogListingChannelExclusions.currencyCode} is null`;
    return and(
      eq(offeringVariants.isActive, true),
      eq(offeringVariants.isOfferingActive, true),
      sql`not exists (
        select 1 from ${catalogListingChannelExclusions}
        where ${catalogListingChannelExclusions.catalogListingId} = ${catalogListings.id}
          and ${catalogListingChannelExclusions.catalogChannelId} = ${channelId}
          ${inThisCurrency}
      )`,
    ) as SQL;
  }

  // The price this caller pays, as an INNER LATERAL relation, so an unpriced listing drops out of the result
  private priceLateral(currencyCode: string) {
    return (
      this.db
        .select({
          amount: catalogListingPrices.amount,
          currencyCode: catalogListingPrices.currencyCode,
          legalEntityId: catalogListingPrices.legalEntityId,
          siteId: catalogListingPrices.siteId,
        })
        .from(catalogListingPrices)
        .where(
          and(
            eq(catalogListingPrices.catalogListingId, catalogListings.id),
            eq(catalogListingPrices.currencyCode, currencyCode),
          ),
        )
        // Reach has already narrowed this to the prices this workspace inherits, so the narrowest of them is the one
        // that applies — site over company over organization, as a channel resolves
        .orderBy(desc(listingPriceSpecificity))
        .limit(1)
        .as('price')
    );
  }

  private static listingPriceColumns(price: ReturnType<CatalogChannelsDomainRepository['priceLateral']>) {
    return { priceCurrency: price.currencyCode, priceAmount: price.amount };
  }

  private static listingSelection(price: ReturnType<CatalogChannelsDomainRepository['priceLateral']>) {
    return {
      id: catalogListings.id,
      offeringVariantId: catalogListings.offeringVariantId,
      code: offeringVariants.code,
      name: offerings.name,
      dimensions: offeringVariants.dimensions,
      attributes: offeringVariants.attributes,
      ...CatalogChannelsDomainRepository.listingPriceColumns(price),
    };
  }

  // One selected group, matched against whichever junction its code lives in.
  private static filterPredicate(selection: ListingFilterSelection): SQL {
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

  // AND across groups, OR within one.
  static filtersWhere(selections: ListingFilterSelection[]): SQL | undefined {
    const predicates = selections
      .filter((selection) => selection.values.length > 0)
      .map((selection) => CatalogChannelsDomainRepository.filterPredicate(selection));
    return predicates.length ? (and(...predicates) as SQL) : undefined;
  }

  // Every branch ends in `id asc`: without a unique tiebreak two rows that tie can swap between pages and a shopper
  // sees one product twice and another never.
  private static orderBy(
    sort: ListingSort,
    priceAlias: ReturnType<CatalogChannelsDomainRepository['priceLateral']>,
  ): SQL[] {
    const price = priceAlias.amount;
    switch (sort) {
      case ListingSortValues.PRICE_ASC:
        return [sql`${price} asc nulls last`, asc(catalogListings.id)];
      case ListingSortValues.PRICE_DESC:
        return [sql`${price} desc nulls last`, asc(catalogListings.id)];
      case ListingSortValues.NEWEST:
        return [desc(catalogListings.createdAt), asc(catalogListings.id)];
      default:
        return [asc(offeringVariants.code), asc(catalogListings.id)];
    }
  }

  // One page of what the resolved channel's catalog malls, at this workspace's price, plus the unfiltered-by-page total
  // the pager needs
  async findListings(
    channel: StorefrontChannel,
    query: { filters: ListingFilterSelection[]; page: number; perPage: number; sort: ListingSort },
    currencyCode: string,
  ): Promise<{ rows: StorefrontListingRow[]; total: number }> {
    const where = and(
      eq(catalogListings.catalogId, channel.catalogId),
      this.availableOnChannel(channel.id, currencyCode),
      CatalogChannelsDomainRepository.filtersWhere(query.filters),
    ) as SQL;
    const price = this.priceLateral(currencyCode);

    const rows = this.db
      .select(CatalogChannelsDomainRepository.listingSelection(price))
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .innerJoinLateral(price, sql`true`)
      .where(where)
      .orderBy(...CatalogChannelsDomainRepository.orderBy(query.sort, price))
      .limit(query.perPage)
      .offset((query.page - 1) * query.perPage);

    const count = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .innerJoinLateral(price, sql`true`)
      .where(where);

    const [result, [{ count: total }]] = await Promise.all([rows, count]);
    return { rows: result, total };
  }

  // One listing by code, which is what a storefront puts in its own address bar.
  async findListingByCode(
    channel: StorefrontChannel,
    code: string,
    currencyCode: string,
  ): Promise<(StorefrontListingRow & { offeringId: string }) | undefined> {
    const price = this.priceLateral(currencyCode);
    const [row] = await this.db
      .select({ ...CatalogChannelsDomainRepository.listingSelection(price), offeringId: offeringVariants.offeringId })
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .innerJoinLateral(price, sql`true`)
      .where(
        and(
          eq(catalogListings.catalogId, channel.catalogId),
          this.availableOnChannel(channel.id, currencyCode),
          eq(offeringVariants.code, code),
        ) as SQL,
      )
      .limit(1);
    return row;
  }

  // Every variant of one offering this channel actually offers, each with the value it carries on each axis.
  findAvailableSiblings(
    channel: StorefrontChannel,
    offeringId: string,
    currencyCode: string,
  ): Promise<VariantSiblingRow[]> {
    return this.db
      .select({
        variantId: offeringVariants.id,
        code: offeringVariants.code,
        dimensionCode: offeringDimensions.code,
        dimensionName: offeringDimensions.name,
        dimensionSortOrder: offeringDimensions.sortOrder,
        valueCode: offeringDimensionValues.code,
        valueName: offeringDimensionValues.value,
        valueSortOrder: offeringDimensionValues.sortOrder,
      })
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .innerJoin(offeringVariantValues, eq(offeringVariantValues.variantId, offeringVariants.id))
      .innerJoin(offeringDimensions, eq(offeringDimensions.id, offeringVariantValues.dimensionId))
      .innerJoin(offeringDimensionValues, eq(offeringDimensionValues.id, offeringVariantValues.valueId))
      .where(
        and(
          eq(catalogListings.catalogId, channel.catalogId),
          this.availableOnChannel(channel.id, currencyCode),
          eq(offeringVariants.offeringId, offeringId),
        ) as SQL,
      )
      .orderBy(asc(offeringDimensions.sortOrder), asc(offeringDimensionValues.sortOrder));
  }

  // The dimension groups present on the listings this channel offers, with a count per value.
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
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .innerJoin(offeringVariantValues, eq(offeringVariantValues.variantId, offeringVariants.id))
      .innerJoin(offeringDimensions, eq(offeringDimensions.id, offeringVariantValues.dimensionId))
      .innerJoin(offeringDimensionValues, eq(offeringDimensionValues.id, offeringVariantValues.valueId))
      .where(and(eq(catalogListings.catalogId, channel.catalogId), this.availableOnChannel(channel.id), where) as SQL)
      .groupBy(offeringDimensions.code, offeringDimensionValues.code)
      .orderBy(
        sql`min(${offeringDimensions.sortOrder})`,
        offeringDimensions.code,
        sql`min(${offeringDimensionValues.sortOrder})`,
        offeringDimensionValues.code,
      );
  }

  // The attribute groups, same shape and same grouping rule.
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
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .innerJoin(offeringVariantAttributeValues, eq(offeringVariantAttributeValues.variantId, offeringVariants.id))
      .innerJoin(offeringAttributes, eq(offeringAttributes.id, offeringVariantAttributeValues.attributeId))
      .innerJoin(offeringAttributeValues, eq(offeringAttributeValues.id, offeringVariantAttributeValues.valueId))
      .where(and(eq(catalogListings.catalogId, channel.catalogId), this.availableOnChannel(channel.id), where) as SQL)
      .groupBy(offeringAttributes.code, offeringAttributeValues.code)
      .orderBy(
        sql`min(${offeringAttributes.sortOrder})`,
        offeringAttributes.code,
        sql`min(${offeringAttributeValues.sortOrder})`,
        offeringAttributeValues.code,
      );
  }

  // Prices variants the caller already holds — a basket or wishlist reconciling stored rows
  async findListingsByCodes(
    channel: StorefrontChannel,
    codes: string[],
    currencyCode: string,
    filters: ListingFilterSelection[] = [],
  ): Promise<StorefrontListingRow[]> {
    // `inArray` with an empty list is a SQL error in some dialects and an always-false in others; neither is worth a
    // round trip when the caller already told us it wants nothing.
    if (!codes.length) return [];

    const price = this.priceLateral(currencyCode);
    return this.db
      .select(CatalogChannelsDomainRepository.listingSelection(price))
      .from(catalogListings)
      .innerJoin(offeringVariants, eq(offeringVariants.id, catalogListings.offeringVariantId))
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .innerJoinLateral(price, sql`true`)
      .where(
        and(
          eq(catalogListings.catalogId, channel.catalogId),
          this.availableOnChannel(channel.id, currencyCode),
          inArray(offeringVariants.code, codes),
          CatalogChannelsDomainRepository.filtersWhere(filters),
        ) as SQL,
      )
      .orderBy(asc(offeringVariants.code));
  }

  // The currencies the resolved catalog carries, which is what a storefront may switch between.
  async findCatalogCurrencies(catalogId: string): Promise<string[]> {
    const rows = (await this.db
      .select({ currencyCode: catalogCurrencies.currencyCode })
      .from(catalogCurrencies)
      .where(eq(catalogCurrencies.catalogId, catalogId))
      .orderBy(asc(catalogCurrencies.sortOrder), asc(catalogCurrencies.currencyCode))) as { currencyCode: string }[];
    return rows.map((row) => row.currencyCode);
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

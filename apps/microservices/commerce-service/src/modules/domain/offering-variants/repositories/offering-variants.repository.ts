import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import {
  and,
  asc,
  eq,
  exists,
  getColumns,
  ilike,
  inArray,
  isNull,
  notExists,
  notInArray,
  or,
  type SQL,
  sql,
} from '@vritti/api-sdk/drizzle-orm';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import { attributesFacetSql, dimensionsFacetSql } from '@/common/variant-facets';
import {
  catalogChannels,
  catalogListingChannelExclusions,
  catalogListings,
  type FulfilmentType,
  FulfilmentTypeValues,
  inventoryItems,
  type NewOfferingVariant,
  type OfferingVariant,
  offeringAttributes,
  offeringAttributeValues,
  offeringBom,
  offeringDimensions,
  offeringDimensionValues,
  offerings,
  offeringVariantAttributeValues,
  offeringVariants,
  offeringVariantValues,
  orderItems,
  ownedByWorkspaceExpression,
  taxClasses,
  uom,
} from '@/db/schema';

export interface OfferingRef {
  id: string;
  code: string;
  name: string;
  fulfilmentType: FulfilmentType;
  taxClassId: string;
  isOwned: boolean;
}

export interface VariantValueRef {
  dimensionId: string;
  dimensionName: string;
  valueId: string;
  value: string;
  valueCode: string;
}

export interface VariantAttributeValueRef {
  attributeId: string;
  attributeName: string;
  valueId: string;
  value: string;
  valueCode: string;
}

export interface VariantOptionRow {
  id: string;
  code: string;
}

export type VariantWithBomCount = OfferingVariant & { bomLineCount: number };

export interface ExportVariantRow {
  code: string;
  externalSku: string | null;
  values: VariantValueRef[];
  salesUomName: string | null;
  taxClassName: string | null;
  isTaxClassOverridden: boolean;
  fulfilmentType: FulfilmentType;
  isFulfilmentOverridden: boolean;
  bomLineCount: number;
  isActive: boolean;
  isOfferingActive: boolean;
}

export interface ChannelExclusionTarget {
  id: string;
  kind: 'APP' | 'TERMINAL';
}

export type OfferingVariantTableRow = OfferingVariant & {
  listed?: boolean;
  availableHere?: boolean;
  salesUomName: string | null;
  taxClassName: string | null;
  values: VariantValueRef[];
  attributeValues: VariantAttributeValueRef[];
  bomLineCount: number;
  canMarkActive: boolean;
  canDelete: boolean;
};

export interface DimensionValueRow {
  dimensionId: string;
  dimensionCode: string;
  dimensionName: string;
  dimensionSortOrder: number;
  valueId: string;
  value: string;
  valueCode: string;
}

export interface AttributeValueRow {
  attributeId: string;
  valueId: string;
}

@Injectable()
export class OfferingVariantsDomainRepository extends PrimaryBaseRepository<typeof offeringVariants> {
  constructor(database: PrimaryDatabaseService) {
    super(database, offeringVariants);
  }

  // The parent offering with its ownership flag, read here rather than through the offerings module
  async findOffering(offeringId: string): Promise<OfferingRef | undefined> {
    const [row] = await this.db
      .select({
        id: offerings.id,
        code: offerings.code,
        name: offerings.name,
        fulfilmentType: offerings.fulfilmentType,
        taxClassId: offerings.taxClassId,
        isOwned: ownedByWorkspaceExpression(offerings),
      })
      .from(offerings)
      .where(eq(offerings.id, offeringId))
      .limit(1);
    return row;
  }

  private valuesJson() {
    return this.db
      .select({
        json: sql`coalesce(json_agg(json_build_object(
          'dimensionId', ${offeringDimensions.id},
          'dimensionName', ${offeringDimensions.name},
          'valueId', ${offeringDimensionValues.id},
          'value', ${offeringDimensionValues.value},
          'valueCode', ${offeringDimensionValues.code}
        ) order by ${offeringDimensions.sortOrder}), '[]'::json)`,
      })
      .from(offeringVariantValues)
      .innerJoin(offeringDimensions, eq(offeringDimensions.id, offeringVariantValues.dimensionId))
      .innerJoin(offeringDimensionValues, eq(offeringDimensionValues.id, offeringVariantValues.valueId))
      .where(eq(offeringVariantValues.variantId, offeringVariants.id));
  }

  // The attribute values the variant carries.
  private attributeValuesJson() {
    return this.db
      .select({
        json: sql`coalesce(json_agg(json_build_object(
          'attributeId', ${offeringAttributes.id},
          'attributeName', ${offeringAttributes.name},
          'valueId', ${offeringAttributeValues.id},
          'value', ${offeringAttributeValues.value},
          'valueCode', ${offeringAttributeValues.code}
        ) order by ${offeringAttributes.sortOrder}, ${offeringAttributeValues.sortOrder}), '[]'::json)`,
      })
      .from(offeringVariantAttributeValues)
      .innerJoin(offeringAttributes, eq(offeringAttributes.id, offeringVariantAttributeValues.attributeId))
      .innerJoin(offeringAttributeValues, eq(offeringAttributeValues.id, offeringVariantAttributeValues.valueId))
      .where(eq(offeringVariantAttributeValues.variantId, offeringVariants.id));
  }

  // The channel's catalog and whether this workspace set it, for a write that must not touch an inherited one
  async findChannelForWrite(channelId: string): Promise<{ id: string; catalogId: string; isOwn: boolean } | undefined> {
    const [row] = await this.db
      .select({
        id: catalogChannels.id,
        catalogId: catalogChannels.catalogId,
        isOwn: ownedByWorkspaceExpression(catalogChannels),
      })
      .from(catalogChannels)
      .where(eq(catalogChannels.id, channelId))
      .limit(1);
    return row;
  }

  // Every listing one variant has in a catalog. A variant listed at several MRPs has one row per MRP, and
  // availability is the variant's, so all of them move together.
  async findListingIdsForVariant(catalogId: string, variantId: string): Promise<string[]> {
    const rows = await this.db
      .select({ id: catalogListings.id })
      .from(catalogListings)
      .where(and(eq(catalogListings.catalogId, catalogId), eq(catalogListings.offeringVariantId, variantId)));
    return rows.map((row) => row.id);
  }

  // Making a variant unavailable writes an outright exclusion per listing, naming the target it is for, so a
  // target sharing an inherited channel with others is the only one affected. Making it available lifts just
  // those rows — the channel's own exclusion, and any other target's, are left standing. A per-currency
  // exclusion is untouched either way; it is the Prices tab's to own.
  async setTargetAvailability(
    channelId: string,
    target: ChannelExclusionTarget,
    listingIds: string[],
    availableHere: boolean,
  ): Promise<void> {
    if (listingIds.length === 0) return;

    const namesThisTarget =
      target.kind === 'APP'
        ? and(eq(catalogListingChannelExclusions.appId, target.id), isNull(catalogListingChannelExclusions.terminalId))
        : and(eq(catalogListingChannelExclusions.terminalId, target.id), isNull(catalogListingChannelExclusions.appId));

    if (availableHere) {
      await this.db
        .delete(catalogListingChannelExclusions)
        .where(
          and(
            eq(catalogListingChannelExclusions.catalogChannelId, channelId),
            inArray(catalogListingChannelExclusions.catalogListingId, listingIds),
            isNull(catalogListingChannelExclusions.currencyCode),
            namesThisTarget,
          ),
        );
      return;
    }

    const named = target.kind === 'APP' ? { appId: target.id } : { terminalId: target.id };
    await this.db
      .insert(catalogListingChannelExclusions)
      .values(listingIds.map((catalogListingId) => ({ catalogListingId, catalogChannelId: channelId, ...named })))
      .onConflictDoNothing();
  }

  // The exclusions belonging to one target, as a branch of the channel's own
  private static excludedForTarget(target?: ChannelExclusionTarget): SQL {
    if (!target) return sql``;
    return target.kind === 'APP'
      ? sql`or ${catalogListingChannelExclusions.appId} = ${target.id}`
      : sql`or ${catalogListingChannelExclusions.terminalId} = ${target.id}`;
  }

  // `channelId` with its `target` adds how that target sees the row, so a storefront view needs no second read.
  //
  // A deactivated variant, or one on a deactivated offering, reads as not listed rather than vanishing:
  // availableOnChannel hides it from the storefront, so the target cannot sell it either way.
  // `availableHere` answers an outright exclusion that is the channel's own or this target's — never another
  // target's, which is the point of naming a target on the exclusion. One naming a currency is the Prices tab's.
  private tableSelection(channelId?: string, target?: ChannelExclusionTarget) {
    const listedInChannel = (extra?: SQL) =>
      exists(
        this.db
          .select({ one: sql`1` })
          .from(catalogListings)
          .innerJoin(catalogChannels, eq(catalogChannels.catalogId, catalogListings.catalogId))
          .where(
            and(
              eq(catalogChannels.id, channelId as string),
              eq(catalogListings.offeringVariantId, offeringVariants.id),
              eq(offeringVariants.isActive, true),
              eq(offeringVariants.isOfferingActive, true),
              extra,
            ),
          ),
      ).mapWith(Boolean);

    return {
      ...getColumns(offeringVariants),
      ...(channelId
        ? {
            listed: listedInChannel(),
            availableHere: listedInChannel(sql`not exists (
              select 1 from ${catalogListingChannelExclusions}
              where ${catalogListingChannelExclusions.catalogListingId} = ${catalogListings.id}
                and ${catalogListingChannelExclusions.catalogChannelId} = ${catalogChannels.id}
                and ((${catalogListingChannelExclusions.appId} is null
                      and ${catalogListingChannelExclusions.terminalId} is null)
                     ${OfferingVariantsDomainRepository.excludedForTarget(target)})
                and ${catalogListingChannelExclusions.currencyCode} is null
            )`),
          }
        : {}),
      salesUomName: uom.name,
      taxClassName: taxClasses.name,
      values: sql<VariantValueRef[]>`(${this.valuesJson()})`,
      attributeValues: sql<VariantAttributeValueRef[]>`(${this.attributeValuesJson()})`,
      bomLineCount: this.db.$count(offeringBom, eq(offeringBom.variantId, offeringVariants.id)),
      canMarkActive: sql<boolean>`${offeringVariants.isActive} or ${this.db.$count(
        offeringBom,
        eq(offeringBom.variantId, offeringVariants.id),
      )} >= case ${offeringVariants.fulfilmentType} when ${FulfilmentTypeValues.SERVICE} then 0 else 1 end`.mapWith(
        Boolean,
      ),
      canDelete: notExists(
        this.db.select({ one: sql`1` }).from(orderItems).where(eq(orderItems.offeringVariantId, offeringVariants.id)),
      ).mapWith(Boolean),
    };
  }

  private tableJoins() {
    return [
      { table: uom, on: eq(uom.id, offeringVariants.salesUomId) },
      { table: taxClasses, on: eq(taxClasses.id, offeringVariants.taxClassId) },
      { table: offerings, on: eq(offerings.id, offeringVariants.offeringId) },
    ];
  }

  async findByIdWithNames(id: string): Promise<OfferingVariantTableRow | undefined> {
    const { result } = await this.findAllAndCount<OfferingVariantTableRow>({
      select: this.tableSelection(),
      innerJoins: this.tableJoins(),
      where: eq(offeringVariants.id, id),
      limit: 1,
      offset: 0,
    });
    return result[0];
  }

  // One page of an offering's variants, plus the unpaginated total for the table footer
  async findForTable(options: {
    where: SQL;
    orderBy: SQL[];
    limit: number;
    offset: number;
    channelId?: string;
    target?: ChannelExclusionTarget;
  }): Promise<{ result: OfferingVariantTableRow[]; count: number }> {
    return this.findAllAndCount<OfferingVariantTableRow>({
      select: this.tableSelection(options.channelId, options.target),
      innerJoins: this.tableJoins(),
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Every dimension value of an offering, ordered so a code can be assembled straight from it
  async findDimensionValues(offeringId: string): Promise<DimensionValueRow[]> {
    return this.db
      .select({
        dimensionId: offeringDimensions.id,
        dimensionCode: offeringDimensions.code,
        dimensionName: offeringDimensions.name,
        dimensionSortOrder: offeringDimensions.sortOrder,
        valueId: offeringDimensionValues.id,
        value: offeringDimensionValues.value,
        valueCode: offeringDimensionValues.code,
      })
      .from(offeringDimensions)
      .innerJoin(offeringDimensionValues, eq(offeringDimensionValues.dimensionId, offeringDimensions.id))
      .where(eq(offeringDimensions.offeringId, offeringId))
      .orderBy(asc(offeringDimensions.sortOrder), asc(offeringDimensionValues.sortOrder));
  }

  // Every attribute value an offering offers, so an assignment can be checked against the offering that owns it.
  async findAttributeValues(offeringId: string): Promise<AttributeValueRow[]> {
    return this.db
      .select({ attributeId: offeringAttributes.id, valueId: offeringAttributeValues.id })
      .from(offeringAttributes)
      .innerJoin(offeringAttributeValues, eq(offeringAttributeValues.attributeId, offeringAttributes.id))
      .where(eq(offeringAttributes.offeringId, offeringId));
  }

  async countDimensions(offeringId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(offeringDimensions)
      .where(eq(offeringDimensions.offeringId, offeringId));
    return row?.n ?? 0;
  }

  async findForSelectInOffering(
    config: FindForSelectConfig,
    offeringId: string,
    catalogId?: string,
  ): Promise<SelectQueryResult> {
    const conditions = [
      eq(offeringVariants.offeringId, offeringId),
      eq(offeringVariants.isActive, true),
      eq(offeringVariants.isOfferingActive, true),
    ];
    // Listed for any batch it can take nothing further here; listed at an MRP it can still take another
    if (catalogId) {
      conditions.push(
        sql`not exists (
        select 1 from ${catalogListings}
        where ${catalogListings.offeringVariantId} = ${offeringVariants.id}
          and ${catalogListings.catalogId} = ${catalogId}
          and ${catalogListings.inventoryItemMrpId} is null
      )` as SQL,
      );
    }
    return super.findForSelect({ ...config, conditions });
  }

  // Rewrites the cached facets from the junctions in one statement, so the copy cannot disagree with them
  async refreshFacets(variantIds: string[]): Promise<void> {
    if (variantIds.length === 0) return;
    await this.db
      .update(offeringVariants)
      .set({ dimensions: dimensionsFacetSql(), attributes: attributesFacetSql() })
      .where(inArray(offeringVariants.id, variantIds));
  }

  // Every variant of an offering, for when a dimension, an attribute or one of their values is renamed
  async findVariantIdsForOffering(offeringId: string): Promise<string[]> {
    const rows = await this.db
      .select({ id: offeringVariants.id })
      .from(offeringVariants)
      .where(eq(offeringVariants.offeringId, offeringId));
    return rows.map((row) => row.id);
  }

  // Variant options for a picker, across every offering this workspace can reach
  async findOptions(options: {
    search?: string;
    excludeIds?: string[];
    limit: number;
    offset: number;
  }): Promise<{ items: VariantOptionRow[]; total: number }> {
    const search = options.search?.trim();
    // Codes carry every value code, so "masala" still finds hf-kichidi-250g-classic-masala
    const where = and(
      search ? or(ilike(offeringVariants.code, `%${search}%`), ilike(offerings.name, `%${search}%`)) : undefined,
      options.excludeIds?.length ? notInArray(offeringVariants.id, options.excludeIds) : undefined,
    );

    const items = this.db
      .select({
        id: offeringVariants.id,
        code: offeringVariants.code,
      })
      .from(offeringVariants)
      .innerJoin(offerings, eq(offerings.id, offeringVariants.offeringId))
      .where(where)
      .orderBy(asc(offeringVariants.code))
      .limit(options.limit)
      .offset(options.offset);

    const count = this.db.select({ count: sql<number>`count(*)::int` }).from(offeringVariants).where(where);

    const [rows, [{ count: total }]] = await Promise.all([items, count]);
    return { items: rows, total };
  }

  // Which of these SKUs are already taken. Org-wide, matching the constraint — RLS scopes it.
  async findTakenCodes(codes: string[]): Promise<string[]> {
    if (codes.length === 0) return [];
    const rows = await this.db
      .select({ code: offeringVariants.code })
      .from(offeringVariants)
      .where(inArray(offeringVariants.code, codes));
    return rows.map((row) => row.code);
  }

  // The combination keys already taken on this offering, so those combinations can be skipped
  async findCombinationKeys(offeringId: string): Promise<string[]> {
    const rows = await this.db
      .select({ combinationKey: offeringVariants.combinationKey })
      .from(offeringVariants)
      .where(eq(offeringVariants.offeringId, offeringId));
    return rows.map((row) => row.combinationKey);
  }

  // The given variants, restricted to one offering — ids from another offering simply do not come back, so the caller
  // can compare counts rather than trusting the payload
  async findManyInOffering(offeringId: string, ids: string[]): Promise<VariantWithBomCount[]> {
    if (ids.length === 0) return [];
    return this.db
      .select({
        ...getColumns(offeringVariants),
        bomLineCount: this.db.$count(offeringBom, eq(offeringBom.variantId, offeringVariants.id)),
      })
      .from(offeringVariants)
      .where(and(eq(offeringVariants.offeringId, offeringId), inArray(offeringVariants.id, ids)));
  }

  // Reads only the columns the export file carries, skipping everything selection() derives
  async findForExport(offeringId: string, page: { limit: number; offset: number }): Promise<ExportVariantRow[]> {
    return this.db
      .select({
        code: offeringVariants.code,
        externalSku: offeringVariants.externalSku,
        values: sql<VariantValueRef[]>`(${this.valuesJson()})`,
        salesUomName: uom.name,
        taxClassName: taxClasses.name,
        isTaxClassOverridden: offeringVariants.isTaxClassOverridden,
        fulfilmentType: offeringVariants.fulfilmentType,
        isFulfilmentOverridden: offeringVariants.isFulfilmentOverridden,
        bomLineCount: this.db.$count(offeringBom, eq(offeringBom.variantId, offeringVariants.id)),
        isActive: offeringVariants.isActive,
        isOfferingActive: offeringVariants.isOfferingActive,
      })
      .from(offeringVariants)
      .innerJoin(uom, eq(uom.id, offeringVariants.salesUomId))
      .innerJoin(taxClasses, eq(taxClasses.id, offeringVariants.taxClassId))
      .where(eq(offeringVariants.offeringId, offeringId))
      .orderBy(asc(offeringVariants.code))
      .limit(page.limit)
      .offset(page.offset);
  }

  // Flips is_active on many variants at once; the caller has already checked each one may make the move
  async bulkSetStatus(ids: string[], isActive: boolean): Promise<void> {
    if (ids.length === 0) return;
    await this.db.update(offeringVariants).set({ isActive }).where(inArray(offeringVariants.id, ids));
  }

  // Sets a tax class on many variants at once.
  async bulkSetTaxClass(ids: string[], taxClassId: string, isTaxClassOverridden: boolean): Promise<void> {
    if (ids.length === 0) return;
    await this.db
      .update(offeringVariants)
      .set({ taxClassId, isTaxClassOverridden })
      .where(inArray(offeringVariants.id, ids));
  }

  async insertVariants(rows: NewOfferingVariant[]): Promise<OfferingVariant[]> {
    if (rows.length === 0) return [];
    return this.db.insert(offeringVariants).values(rows).returning();
  }

  async insertVariantValues(rows: { variantId: string; dimensionId: string; valueId: string }[]): Promise<void> {
    if (rows.length === 0) return;
    await this.db.insert(offeringVariantValues).values(rows);
  }

  // BOM lines with the item and unit names the UI shows
  async findBomLines(variantIds: string[]) {
    if (variantIds.length === 0) return [];
    return this.db
      .select({
        id: offeringBom.id,
        variantId: offeringBom.variantId,
        inventoryItemId: offeringBom.inventoryItemId,
        inventoryItemName: inventoryItems.name,
        inventoryItemSku: inventoryItems.sku,
        quantity: offeringBom.quantity,
        uomId: offeringBom.uomId,
        uomName: uom.name,
        sortOrder: offeringBom.sortOrder,
      })
      .from(offeringBom)
      .innerJoin(inventoryItems, eq(inventoryItems.id, offeringBom.inventoryItemId))
      .innerJoin(uom, eq(uom.id, offeringBom.uomId))
      .where(inArray(offeringBom.variantId, variantIds))
      .orderBy(asc(offeringBom.sortOrder));
  }

  // How many order lines name this variant — the FK is NO ACTION, so any at all blocks a delete
  async countOrderLines(variantId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(orderItems)
      .where(eq(orderItems.offeringVariantId, variantId));
    return row?.n ?? 0;
  }

  async countBomLines(variantId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(offeringBom)
      .where(eq(offeringBom.variantId, variantId));
    return row?.n ?? 0;
  }

  async deleteVariantValues(variantId: string): Promise<void> {
    await this.db.delete(offeringVariantValues).where(eq(offeringVariantValues.variantId, variantId));
  }

  async insertVariantAttributeValues(
    rows: { variantId: string; attributeId: string; valueId: string }[],
  ): Promise<void> {
    if (rows.length === 0) return;
    await this.db.insert(offeringVariantAttributeValues).values(rows);
  }

  async deleteVariantAttributeValues(variantId: string): Promise<void> {
    await this.db.delete(offeringVariantAttributeValues).where(eq(offeringVariantAttributeValues.variantId, variantId));
  }

  // Clears ONE attribute across many variants, leaving their other attributes alone — the bulk action sets a single
  // axis, so it must not touch what it was not shown
  async deleteVariantAttributeValuesForAttribute(variantIds: string[], attributeId: string): Promise<void> {
    if (variantIds.length === 0) return;
    await this.db
      .delete(offeringVariantAttributeValues)
      .where(
        and(
          inArray(offeringVariantAttributeValues.variantId, variantIds),
          eq(offeringVariantAttributeValues.attributeId, attributeId),
        ),
      );
  }

  // One attribute, restricted to an offering — an id from another offering simply does not come back
  async findAttributeInOffering(
    attributeId: string,
    offeringId: string,
  ): Promise<{ id: string; name: string } | undefined> {
    const [row] = await this.db
      .select({ id: offeringAttributes.id, name: offeringAttributes.name })
      .from(offeringAttributes)
      .where(and(eq(offeringAttributes.id, attributeId), eq(offeringAttributes.offeringId, offeringId)))
      .limit(1);
    return row;
  }
}

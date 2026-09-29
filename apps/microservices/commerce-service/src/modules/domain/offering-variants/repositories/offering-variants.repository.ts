import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, getColumns, inArray, notExists, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import {
  type FulfilmentType,
  FulfilmentTypeValues,
  inventoryItems,
  type NewOfferingBomLine,
  type NewOfferingVariant,
  type OfferingVariant,
  offeringBom,
  offeringDimensions,
  offeringDimensionValues,
  offerings,
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

export type VariantWithBomCount = OfferingVariant & { bomLineCount: number };

export interface ExportVariantRow {
  sku: string;
  externalSku: string | null;
  name: string;
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

export type OfferingVariantTableRow = OfferingVariant & {
  salesUomName: string | null;
  taxClassName: string | null;
  values: VariantValueRef[];
  bomLineCount: number;
  canMarkActive: boolean;
  canDelete: boolean;
};

export interface DimensionValueRow {
  dimensionId: string;
  dimensionName: string;
  dimensionSortOrder: number;
  valueId: string;
  value: string;
  valueCode: string;
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
        isOwned: ownedByWorkspaceExpression(),
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

  private tableSelection() {
    return {
      ...getColumns(offeringVariants),
      salesUomName: uom.name,
      taxClassName: taxClasses.name,
      values: sql<VariantValueRef[]>`(${this.valuesJson()})`,
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
      leftJoins: this.tableJoins(),
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
  }): Promise<{ result: OfferingVariantTableRow[]; count: number }> {
    return this.findAllAndCount<OfferingVariantTableRow>({
      select: this.tableSelection(),
      leftJoins: this.tableJoins(),
      where: options.where,
      orderBy: options.orderBy,
      limit: options.limit,
      offset: options.offset,
    });
  }

  // Every dimension value of an offering, ordered so a SKU can be assembled straight from it
  async findDimensionValues(offeringId: string): Promise<DimensionValueRow[]> {
    return this.db
      .select({
        dimensionId: offeringDimensions.id,
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

  async countDimensions(offeringId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(offeringDimensions)
      .where(eq(offeringDimensions.offeringId, offeringId));
    return row?.n ?? 0;
  }

  async findForSelectInOffering(config: FindForSelectConfig, offeringId: string): Promise<SelectQueryResult> {
    return super.findForSelect({
      ...config,
      conditions: [
        eq(offeringVariants.offeringId, offeringId),
        eq(offeringVariants.isActive, true),
        eq(offeringVariants.isOfferingActive, true),
      ],
    });
  }

  /**
   * Variants one storefront channel actually sells.
   *
   * A subquery rather than a join, so this stays a plain select over variants and the base helper's
   * search, paging and ordering keep working untouched.
   *
   * The channel is resolved inside it — passing a catalog id instead would let a caller name a
   * catalogue the channel does not point at. Delisting removes the listing row rather than flagging
   * it, so being listed at all is the test; anything this channel excludes is dropped on top.
   *
   * Retired variants are dropped too, on the same `is_active AND is_offering_active` rule a basket
   * line is priced by — otherwise the picker would offer a product whose line reads unavailable the
   * moment it lands in the basket.
   */
  async findForSelectInChannel(config: FindForSelectConfig, channelId: string): Promise<SelectQueryResult> {
    const soldByChannel = sql`exists (
      select 1
        from commerce.catalog_listings l
        join commerce.catalog_channels ch on ch.catalog_id = l.catalog_id
       where l.offering_variant_id = ${offeringVariants.id}
         and ch.id = ${channelId}
         and not exists (
           select 1 from commerce.catalog_listing_channel_exclusions e
            where e.catalog_listing_id = l.id and e.catalog_channel_id = ch.id
         )
    )`;
    return super.findForSelect({
      ...config,
      conditions: [soldByChannel, eq(offeringVariants.isActive, true), eq(offeringVariants.isOfferingActive, true)],
    });
  }

  // Which of these SKUs are already taken. Org-wide, matching the constraint — RLS scopes it.
  async findTakenSkus(skus: string[]): Promise<string[]> {
    if (skus.length === 0) return [];
    const rows = await this.db
      .select({ sku: offeringVariants.sku })
      .from(offeringVariants)
      .where(inArray(offeringVariants.sku, skus));
    return rows.map((row) => row.sku);
  }

  // The combination keys already taken on this offering, so those combinations can be skipped
  async findCombinationKeys(offeringId: string): Promise<string[]> {
    const rows = await this.db
      .select({ combinationKey: offeringVariants.combinationKey })
      .from(offeringVariants)
      .where(eq(offeringVariants.offeringId, offeringId));
    return rows.map((row) => row.combinationKey);
  }

  // The given variants, restricted to one offering — ids from another offering simply do not come back,
  // so the caller can compare counts rather than trusting the payload
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
        sku: offeringVariants.sku,
        externalSku: offeringVariants.externalSku,
        name: offeringVariants.name,
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
      .leftJoin(uom, eq(uom.id, offeringVariants.salesUomId))
      .leftJoin(taxClasses, eq(taxClasses.id, offeringVariants.taxClassId))
      .where(eq(offeringVariants.offeringId, offeringId))
      .orderBy(asc(offeringVariants.sku))
      .limit(page.limit)
      .offset(page.offset);
  }

  // Flips is_active on many variants at once; the caller has already checked each one may make the move
  async bulkSetStatus(ids: string[], isActive: boolean): Promise<void> {
    if (ids.length === 0) return;
    await this.db.update(offeringVariants).set({ isActive }).where(inArray(offeringVariants.id, ids));
  }

  // Sets a tax class on many variants at once. Overridden pins them, exempting each from the
  // offering's cascade; clearing it hands them back to the offering.
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

  // One line, with the variant it belongs to, so ownership can be checked from a line id alone
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
}

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import {
  and,
  asc,
  eq,
  getColumns,
  ilike,
  inArray,
  notExists,
  notInArray,
  or,
  type SQL,
  sql,
} from '@vritti/api-sdk/drizzle-orm';
import { type FindForSelectConfig, type SelectQueryResult } from '@vritti/api-sdk/select';
import {
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
  attributeValues: VariantAttributeValueRef[];
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

  // The attribute values the variant carries. Ordered by attribute then value so the UI groups them
  // without sorting, and unlike valuesJson() there may be several rows per attribute.
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

  private tableSelection() {
    return {
      ...getColumns(offeringVariants),
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

  // Every attribute value an offering offers, so an assignment can be checked against the offering that
  // owns it. Only the ids matter — the caller is validating a submitted set, not rendering it.
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

  // Variant options for a picker, across every offering this workspace can reach. `excludeIds` is
  // applied in SQL rather than by the caller: filtering a page after it is fetched can return an empty
  // page while matches sit on the next one, which reads as "nothing left" and is indistinguishable
  // from it.
  async findOptions(options: {
    search?: string;
    excludeIds?: string[];
    limit: number;
    offset: number;
  }): Promise<{ items: { id: string; sku: string; name: string }[]; total: number }> {
    const search = options.search?.trim();
    const where = and(
      search ? or(ilike(offeringVariants.sku, `%${search}%`), ilike(offeringVariants.name, `%${search}%`)) : undefined,
      options.excludeIds?.length ? notInArray(offeringVariants.id, options.excludeIds) : undefined,
    );

    const items = this.db
      .select({ id: offeringVariants.id, sku: offeringVariants.sku, name: offeringVariants.name })
      .from(offeringVariants)
      .where(where)
      .orderBy(asc(offeringVariants.sku))
      .limit(options.limit)
      .offset(options.offset);

    const count = this.db.select({ count: sql<number>`count(*)::int` }).from(offeringVariants).where(where);

    const [rows, [{ count: total }]] = await Promise.all([items, count]);
    return { items: rows, total };
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

  async insertVariantAttributeValues(
    rows: { variantId: string; attributeId: string; valueId: string }[],
  ): Promise<void> {
    if (rows.length === 0) return;
    await this.db.insert(offeringVariantAttributeValues).values(rows);
  }

  async deleteVariantAttributeValues(variantId: string): Promise<void> {
    await this.db.delete(offeringVariantAttributeValues).where(eq(offeringVariantAttributeValues.variantId, variantId));
  }

  // Clears ONE attribute across many variants, leaving their other attributes alone — the bulk action
  // sets a single axis, so it must not touch what it was not shown
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

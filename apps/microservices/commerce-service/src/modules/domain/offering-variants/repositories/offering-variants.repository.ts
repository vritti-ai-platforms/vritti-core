import { Injectable } from '@nestjs/common';
import {
  type FindForSelectConfig,
  MAX_PAGE_SIZE,
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { and, asc, eq, getColumns, inArray, notExists, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
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
  ownedByWorkspace,
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

export type OfferingVariantWithNames = OfferingVariant & {
  salesUomName: string | null;
  taxClassName: string | null;
  values: VariantValueRef[];
  bomLineCount: number;
  canMarkActive: boolean;
  canDelete: boolean;
  inventoryItemId: string | null;
  inventoryItemName: string | null;
  inventoryItemUomId: string | null;
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
        isOwned: ownedByWorkspace(),
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

  private selection() {
    return {
      ...getColumns(offeringVariants),
      salesUomName: uom.name,
      taxClassName: taxClasses.name,
      values: sql<VariantValueRef[]>`(${this.valuesJson()})`,
      bomLineCount: this.db.$count(offeringBom, eq(offeringBom.variantId, offeringVariants.id)),
      canMarkActive: sql<boolean>`${offeringVariants.isActive} or ${this.db.$count(
        offeringBom,
        eq(offeringBom.variantId, offeringVariants.id),
      )} >= case ${offerings.fulfilmentType} when ${FulfilmentTypeValues.SERVICE} then 0 else 1 end`.mapWith(Boolean),
      inventoryItemId: inventoryItems.id,
      inventoryItemName: inventoryItems.name,
      inventoryItemUomId: inventoryItems.uomId,
      canDelete: notExists(
        this.db.select({ one: sql`1` }).from(orderItems).where(eq(orderItems.offeringVariantId, offeringVariants.id)),
      ).mapWith(Boolean),
    };
  }

  private joins() {
    return [
      { table: uom, on: eq(uom.id, offeringVariants.salesUomId) },
      { table: taxClasses, on: eq(taxClasses.id, offeringVariants.taxClassId) },
      { table: offerings, on: eq(offerings.id, offeringVariants.offeringId) },
      // SKU is unique per organization, so the item carrying a variant's SKU is a to-one match
      { table: inventoryItems, on: eq(inventoryItems.sku, offeringVariants.sku) },
    ];
  }

  async findByOffering(offeringId: string): Promise<OfferingVariantWithNames[]> {
    const { result } = await this.findAllAndCount<OfferingVariantWithNames>({
      select: this.selection(),
      leftJoins: this.joins(),
      where: eq(offeringVariants.offeringId, offeringId),
      orderBy: [asc(offeringVariants.sortOrder), asc(offeringVariants.sku)],
      limit: MAX_PAGE_SIZE,
      offset: 0,
    });
    return result;
  }

  async findByIdWithNames(id: string): Promise<OfferingVariantWithNames | undefined> {
    const { result } = await this.findAllAndCount<OfferingVariantWithNames>({
      select: this.selection(),
      leftJoins: this.joins(),
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
  }): Promise<{ result: OfferingVariantWithNames[]; count: number }> {
    return this.findAllAndCount<OfferingVariantWithNames>({
      select: this.selection(),
      leftJoins: this.joins(),
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

  // The inventory item carrying each of these SKUs, keyed by SKU. Read here rather than through the
  // inventory-items module — a domain module owns its own cross-table reads. Returns the item rather
  // than a boolean so a variant can offer it as the bill-of-materials suggestion it almost always is.
  // Variants of one offering, for the breadcrumb switcher. Scoped by offeringId rather than left
  // org-wide: a SKU only means anything next to its siblings.
  // The item carrying a SKU, for the bill-of-materials suggestion. One variant at a time — the list
  // paths get the same item through the join in selection().
  async findInventoryItemBySku(sku: string): Promise<{ id: string; name: string; uomId: string } | undefined> {
    const [row] = await this.db
      .select({ id: inventoryItems.id, name: inventoryItems.name, uomId: inventoryItems.uomId })
      .from(inventoryItems)
      .where(eq(inventoryItems.sku, sku))
      .limit(1);
    return row;
  }

  async findForSelectInOffering(config: FindForSelectConfig, offeringId: string): Promise<SelectQueryResult> {
    return super.findForSelect({ ...config, conditions: [eq(offeringVariants.offeringId, offeringId)] });
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

  // Which value ids each existing variant holds, so already-created combinations can be skipped
  async findVariantValueIds(offeringId: string): Promise<{ variantId: string; valueId: string }[]> {
    return this.db
      .select({ variantId: offeringVariantValues.variantId, valueId: offeringVariantValues.valueId })
      .from(offeringVariantValues)
      .innerJoin(offeringVariants, eq(offeringVariants.id, offeringVariantValues.variantId))
      .where(eq(offeringVariants.offeringId, offeringId));
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

  // Flips is_active on many variants at once; the caller has already checked each one may make the move
  async bulkSetStatus(ids: string[], isActive: boolean): Promise<void> {
    if (ids.length === 0) return;
    await this.db.update(offeringVariants).set({ isActive }).where(inArray(offeringVariants.id, ids));
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

  async findBomLine(lineId: string): Promise<(typeof offeringBom.$inferSelect & { variantId: string }) | undefined> {
    const [row] = await this.db.select().from(offeringBom).where(eq(offeringBom.id, lineId)).limit(1);
    return row;
  }

  async countBomLines(variantId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(offeringBom)
      .where(eq(offeringBom.variantId, variantId));
    return row?.n ?? 0;
  }

  async insertBomLine(row: NewOfferingBomLine): Promise<void> {
    await this.db.insert(offeringBom).values(row);
  }

  async updateBomLine(lineId: string, data: { quantity?: number; uomId?: string }): Promise<void> {
    await this.db.update(offeringBom).set(data).where(eq(offeringBom.id, lineId));
  }

  async deleteBomLine(lineId: string): Promise<void> {
    await this.db.delete(offeringBom).where(eq(offeringBom.id, lineId));
  }

  async nextBomSortOrder(variantId: string): Promise<number> {
    const [row] = await this.db
      .select({ max: sql<number | null>`max(${offeringBom.sortOrder})` })
      .from(offeringBom)
      .where(eq(offeringBom.variantId, variantId));
    return (row?.max ?? -1) + 1;
  }

  async replaceBom(variantId: string, lines: NewOfferingBomLine[]): Promise<void> {
    const client = this.db;
    await client.delete(offeringBom).where(eq(offeringBom.variantId, variantId));
    if (lines.length > 0) await client.insert(offeringBom).values(lines);
  }

  async deleteVariantValues(variantId: string): Promise<void> {
    await this.db.delete(offeringVariantValues).where(eq(offeringVariantValues.variantId, variantId));
  }
}

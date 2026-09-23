import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { asc, eq, getColumns, inArray, notExists, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  dimensionTemplates,
  dimensionTemplateValues,
  type NewOfferingDimensionValue,
  type OfferingDimension,
  type OfferingDimensionValue,
  offeringDimensions,
  offeringDimensionValues,
  offerings,
  offeringVariantValues,
  ownedByWorkspace,
} from '@/db/schema';

export type OfferingDimensionWithUsage = OfferingDimension & { canDelete: boolean };
export type OfferingDimensionValueWithUsage = OfferingDimensionValue & { canDelete: boolean };

@Injectable()
export class OfferingDimensionsDomainRepository extends PrimaryBaseRepository<typeof offeringDimensions> {
  constructor(database: PrimaryDatabaseService) {
    super(database, offeringDimensions);
  }

  // The parent offering, read here rather than through the offerings module — a domain module owns
  // its own cross-table reads. Pass requireOwned to narrow to offerings this workspace owns rather
  // than merely inherits; without it the lookup is reachability alone, which is what reads need.
  async findOffering(
    offeringId: string,
    options: { requireOwned?: boolean } = {},
  ): Promise<{ id: string; code: string; name: string } | undefined> {
    const [row] = await this.db
      .select({ id: offerings.id, code: offerings.code, name: offerings.name })
      .from(offerings)
      .where(
        options.requireOwned
          ? sql`${offerings.id} = ${offeringId} and ${ownedByWorkspace()}`
          : eq(offerings.id, offeringId),
      )
      .limit(1);
    return row;
  }

  async findByOffering(offeringId: string): Promise<OfferingDimensionWithUsage[]> {
    return this.db
      .select({
        ...getColumns(offeringDimensions),
        canDelete: notExists(
          this.db
            .select({ one: sql`1` })
            .from(offeringVariantValues)
            .where(eq(offeringVariantValues.dimensionId, offeringDimensions.id)),
        ).mapWith(Boolean),
      })
      .from(offeringDimensions)
      .where(eq(offeringDimensions.offeringId, offeringId))
      .orderBy(asc(offeringDimensions.sortOrder));
  }

  async findValues(dimensionIds: string[]): Promise<OfferingDimensionValueWithUsage[]> {
    if (dimensionIds.length === 0) return [];
    return this.db
      .select({
        ...getColumns(offeringDimensionValues),
        canDelete: notExists(
          this.db
            .select({ one: sql`1` })
            .from(offeringVariantValues)
            .where(eq(offeringVariantValues.valueId, offeringDimensionValues.id)),
        ).mapWith(Boolean),
      })
      .from(offeringDimensionValues)
      .where(inArray(offeringDimensionValues.dimensionId, dimensionIds))
      .orderBy(asc(offeringDimensionValues.sortOrder), asc(offeringDimensionValues.value));
  }

  async createValues(rows: NewOfferingDimensionValue[]): Promise<OfferingDimensionValue[]> {
    if (rows.length === 0) return [];
    return this.db.insert(offeringDimensionValues).values(rows).returning();
  }

  // The next free position — a new dimension appends, and can be moved afterwards
  async nextSortOrder(offeringId: string): Promise<number> {
    const [row] = await this.db
      .select({ max: sql<number | null>`max(${offeringDimensions.sortOrder})` })
      .from(offeringDimensions)
      .where(eq(offeringDimensions.offeringId, offeringId));
    return (row?.max ?? -1) + 1;
  }

  // A reachable, active template with its values, for the seed-from-template path. Read here rather
  // than through the templates module — a domain module owns its own cross-table reads.
  async findTemplateWithValues(
    templateId: string,
  ): Promise<
    { code: string; name: string; description: string | null; values: { code: string; value: string }[] } | undefined
  > {
    const [template] = await this.db
      .select({
        code: dimensionTemplates.code,
        name: dimensionTemplates.name,
        description: dimensionTemplates.description,
        isActive: dimensionTemplates.isActive,
      })
      .from(dimensionTemplates)
      .where(eq(dimensionTemplates.id, templateId))
      .limit(1);
    if (!template) return undefined;

    const values = await this.db
      .select({ code: dimensionTemplateValues.code, value: dimensionTemplateValues.value })
      .from(dimensionTemplateValues)
      .where(eq(dimensionTemplateValues.templateId, templateId))
      .orderBy(asc(dimensionTemplateValues.sortOrder), asc(dimensionTemplateValues.value));

    return { code: template.code, name: template.name, description: template.description ?? null, values };
  }

  async findValuesByDimension(dimensionId: string): Promise<OfferingDimensionValue[]> {
    return this.db
      .select()
      .from(offeringDimensionValues)
      .where(eq(offeringDimensionValues.dimensionId, dimensionId))
      .orderBy(asc(offeringDimensionValues.sortOrder));
  }

  // Value codes on this dimension that a variant already carries — these can never be dropped
  async findValueCodesInUse(dimensionId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ code: offeringDimensionValues.code })
      .from(offeringVariantValues)
      .innerJoin(offeringDimensionValues, eq(offeringDimensionValues.id, offeringVariantValues.valueId))
      .where(eq(offeringVariantValues.dimensionId, dimensionId));
    return rows.map((row) => row.code);
  }

  async deleteValues(valueIds: string[]): Promise<void> {
    if (valueIds.length === 0) return;
    await this.db.delete(offeringDimensionValues).where(inArray(offeringDimensionValues.id, valueIds));
  }

  async updateValue(id: string, data: { value: string; sortOrder: number }): Promise<void> {
    await this.db.update(offeringDimensionValues).set(data).where(eq(offeringDimensionValues.id, id));
  }

  // How many variants use any value of this dimension — blocks deleting it
  async countVariantsUsingDimension(dimensionId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(offeringVariantValues)
      .where(eq(offeringVariantValues.dimensionId, dimensionId));
    return row?.n ?? 0;
  }
}

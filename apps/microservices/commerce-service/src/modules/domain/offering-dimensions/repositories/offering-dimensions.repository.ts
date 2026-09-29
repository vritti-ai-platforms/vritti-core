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
  ownedByWorkspaceExpression,
} from '@/db/schema';
import type { DimensionValueSource } from '../dto/entity/offering-dimension.dto';

export type OfferingDimensionWithUsage = OfferingDimension & { canDelete: boolean };
export type OfferingDimensionValueWithUsage = OfferingDimensionValue & { canDelete: boolean };
export type OfferingDimensionWithValues = OfferingDimensionWithUsage & { values: DimensionValueSource[] };

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
          ? sql`${offerings.id} = ${offeringId} and ${ownedByWorkspaceExpression()}`
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

  // The dimensions plus their values in one read. The outer id is the qualified TABLE, never
  // ${offeringDimensions.id} — a select-list column of the query's own FROM table renders bare and
  // would bind to the subquery's v instead.
  async findByOfferingWithValues(offeringId: string): Promise<OfferingDimensionWithValues[]> {
    return this.db
      .select({
        ...getColumns(offeringDimensions),
        canDelete: notExists(
          this.db
            .select({ one: sql`1` })
            .from(offeringVariantValues)
            .where(eq(offeringVariantValues.dimensionId, offeringDimensions.id)),
        ).mapWith(Boolean),
        values: sql<DimensionValueSource[]>`(
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id', v.id,
                'dimensionId', v.dimension_id,
                'code', v.code,
                'value', v.value,
                'sortOrder', v.sort_order,
                'canDelete', NOT EXISTS (
                  SELECT 1 FROM ${offeringVariantValues} ovv WHERE ovv.value_id = v.id
                )
              )
              ORDER BY v.sort_order, v.value
            ),
            '[]'::json
          )
          FROM ${offeringDimensionValues} v
          WHERE v.dimension_id = ${offeringDimensions}.id
        )`,
      })
      .from(offeringDimensions)
      .where(eq(offeringDimensions.offeringId, offeringId))
      .orderBy(asc(offeringDimensions.sortOrder));
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
  async findTemplateWithValues(templateId: string): Promise<
    | {
        code: string;
        name: string;
        description: string | null;
        isActive: boolean;
        values: { code: string; value: string }[];
      }
    | undefined
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

    return {
      code: template.code,
      name: template.name,
      description: template.description ?? null,
      isActive: template.isActive,
      values,
    };
  }

  async findValuesByDimension(dimensionId: string): Promise<OfferingDimensionValue[]> {
    return this.db
      .select()
      .from(offeringDimensionValues)
      .where(eq(offeringDimensionValues.dimensionId, dimensionId))
      .orderBy(asc(offeringDimensionValues.sortOrder));
  }

  // Value codes on this dimension that a variant already carries — these can never be dropped
  async findValuesInUse(dimensionId: string): Promise<{ id: string; code: string }[]> {
    return this.db
      .selectDistinct({ id: offeringDimensionValues.id, code: offeringDimensionValues.code })
      .from(offeringVariantValues)
      .innerJoin(offeringDimensionValues, eq(offeringDimensionValues.id, offeringVariantValues.valueId))
      .where(eq(offeringVariantValues.dimensionId, dimensionId));
  }

  async deleteValues(valueIds: string[]): Promise<void> {
    if (valueIds.length === 0) return;
    await this.db.delete(offeringDimensionValues).where(inArray(offeringDimensionValues.id, valueIds));
  }

  async updateValue(id: string, data: { code: string; value: string; sortOrder: number }): Promise<void> {
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

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { asc, eq, getColumns, inArray, notExists, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  attributeTemplates,
  attributeTemplateValues,
  type NewOfferingAttributeValue,
  type OfferingAttribute,
  type OfferingAttributeValue,
  offeringAttributes,
  offeringAttributeValues,
  offerings,
  offeringVariantAttributeValues,
  ownedByWorkspaceExpression,
} from '@/db/schema';
import type { AttributeValueSource } from '../dto/entity/offering-attribute.dto';

export type OfferingAttributeWithUsage = OfferingAttribute & { canDelete: boolean };
export type OfferingAttributeValueWithUsage = OfferingAttributeValue & { canDelete: boolean };
export type OfferingAttributeWithValues = OfferingAttributeWithUsage & { values: AttributeValueSource[] };

@Injectable()
export class OfferingAttributesDomainRepository extends PrimaryBaseRepository<typeof offeringAttributes> {
  constructor(database: PrimaryDatabaseService) {
    super(database, offeringAttributes);
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

  async findByOffering(offeringId: string): Promise<OfferingAttributeWithUsage[]> {
    return this.db
      .select({
        ...getColumns(offeringAttributes),
        canDelete: notExists(
          this.db
            .select({ one: sql`1` })
            .from(offeringVariantAttributeValues)
            .where(eq(offeringVariantAttributeValues.attributeId, offeringAttributes.id)),
        ).mapWith(Boolean),
      })
      .from(offeringAttributes)
      .where(eq(offeringAttributes.offeringId, offeringId))
      .orderBy(asc(offeringAttributes.sortOrder));
  }

  // The attributes plus their values in one read. The outer id is the qualified TABLE, never
  // ${offeringAttributes.id} — a select-list column of the query's own FROM table renders bare and
  // would bind to the subquery's v instead.
  async findByOfferingWithValues(offeringId: string): Promise<OfferingAttributeWithValues[]> {
    return this.db
      .select({
        ...getColumns(offeringAttributes),
        canDelete: notExists(
          this.db
            .select({ one: sql`1` })
            .from(offeringVariantAttributeValues)
            .where(eq(offeringVariantAttributeValues.attributeId, offeringAttributes.id)),
        ).mapWith(Boolean),
        values: sql<AttributeValueSource[]>`(
          SELECT COALESCE(
            json_agg(
              json_build_object(
                'id', v.id,
                'attributeId', v.attribute_id,
                'code', v.code,
                'value', v.value,
                'sortOrder', v.sort_order,
                'canDelete', NOT EXISTS (
                  SELECT 1 FROM ${offeringVariantAttributeValues} ovv WHERE ovv.value_id = v.id
                )
              )
              ORDER BY v.sort_order, v.value
            ),
            '[]'::json
          )
          FROM ${offeringAttributeValues} v
          WHERE v.attribute_id = ${offeringAttributes}.id
        )`,
      })
      .from(offeringAttributes)
      .where(eq(offeringAttributes.offeringId, offeringId))
      .orderBy(asc(offeringAttributes.sortOrder));
  }

  async createValues(rows: NewOfferingAttributeValue[]): Promise<OfferingAttributeValue[]> {
    if (rows.length === 0) return [];
    return this.db.insert(offeringAttributeValues).values(rows).returning();
  }

  // The next free position — a new attribute appends, and can be moved afterwards
  async nextSortOrder(offeringId: string): Promise<number> {
    const [row] = await this.db
      .select({ max: sql<number | null>`max(${offeringAttributes.sortOrder})` })
      .from(offeringAttributes)
      .where(eq(offeringAttributes.offeringId, offeringId));
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
        code: attributeTemplates.code,
        name: attributeTemplates.name,
        description: attributeTemplates.description,
        isActive: attributeTemplates.isActive,
      })
      .from(attributeTemplates)
      .where(eq(attributeTemplates.id, templateId))
      .limit(1);
    if (!template) return undefined;

    const values = await this.db
      .select({ code: attributeTemplateValues.code, value: attributeTemplateValues.value })
      .from(attributeTemplateValues)
      .where(eq(attributeTemplateValues.templateId, templateId))
      .orderBy(asc(attributeTemplateValues.sortOrder), asc(attributeTemplateValues.value));

    return {
      code: template.code,
      name: template.name,
      description: template.description ?? null,
      isActive: template.isActive,
      values,
    };
  }

  async findValuesByAttribute(attributeId: string): Promise<OfferingAttributeValue[]> {
    return this.db
      .select()
      .from(offeringAttributeValues)
      .where(eq(offeringAttributeValues.attributeId, attributeId))
      .orderBy(asc(offeringAttributeValues.sortOrder));
  }

  // Value codes on this attribute that a variant already carries — these can never be dropped
  async findValuesInUse(attributeId: string): Promise<{ id: string; code: string }[]> {
    return this.db
      .selectDistinct({ id: offeringAttributeValues.id, code: offeringAttributeValues.code })
      .from(offeringVariantAttributeValues)
      .innerJoin(offeringAttributeValues, eq(offeringAttributeValues.id, offeringVariantAttributeValues.valueId))
      .where(eq(offeringVariantAttributeValues.attributeId, attributeId));
  }

  async deleteValues(valueIds: string[]): Promise<void> {
    if (valueIds.length === 0) return;
    await this.db.delete(offeringAttributeValues).where(inArray(offeringAttributeValues.id, valueIds));
  }

  async updateValue(id: string, data: { code: string; value: string; sortOrder: number }): Promise<void> {
    await this.db.update(offeringAttributeValues).set(data).where(eq(offeringAttributeValues.id, id));
  }

  // How many variants use any value of this attribute — blocks deleting it
  async countVariantsUsingAttribute(attributeId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: sql<number>`count(*)::int` })
      .from(offeringVariantAttributeValues)
      .where(eq(offeringVariantAttributeValues.attributeId, attributeId));
    return row?.n ?? 0;
  }
}

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, getColumns, inArray, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type DimensionTemplate,
  type DimensionTemplateValue,
  dimensionTemplates,
  dimensionTemplateValues,
  ownedByWorkspace,
} from '@/db/schema';

export type DimensionTemplateWithOwnership = DimensionTemplate & { isOwned: boolean };

@Injectable()
export class DimensionTemplatesDomainRepository extends PrimaryBaseRepository<typeof dimensionTemplates> {
  constructor(database: PrimaryDatabaseService) {
    super(database, dimensionTemplates);
  }

  // Returns the templates this workspace can reach, each flagged with whether it owns the row or
  // merely inherits it from a wider scope (RLS decides reach; ownedByWorkspace decides ownership)
  async findAll(where?: SQL): Promise<DimensionTemplateWithOwnership[]> {
    return this.db
      .select({ ...getColumns(dimensionTemplates), isOwned: ownedByWorkspace() })
      .from(dimensionTemplates)
      .where(where)
      .orderBy(asc(dimensionTemplates.name));
  }

  // Returns one template with its ownership flag, or undefined when out of reach. Pass requireOwned
  // to narrow the lookup to rows this workspace owns rather than merely inherits.
  async findById(
    id: string,
    options: { requireOwned?: boolean } = {},
  ): Promise<DimensionTemplateWithOwnership | undefined> {
    const [row] = await this.db
      .select({ ...getColumns(dimensionTemplates), isOwned: ownedByWorkspace() })
      .from(dimensionTemplates)
      .where(
        options.requireOwned
          ? and(eq(dimensionTemplates.id, id), sql`${ownedByWorkspace()}`)
          : eq(dimensionTemplates.id, id),
      )
      .limit(1);
    return row;
  }

  // Reports which of the two unique keys are already taken, in one pass. They have different scopes:
  // name is unique per OWNER, code per ORGANIZATION — so an org-owned code blocks an LE too, while an
  // org-owned name does not. A single row may collide on both, hence bool_or rather than a row lookup.
  async findConflicts(name: string, code: string): Promise<{ nameTaken: boolean; codeTaken: boolean }> {
    const nameMatch = sql`lower(${dimensionTemplates.name}) = lower(${name}) and ${ownedByWorkspace()}`;
    const codeMatch = sql`${dimensionTemplates.code} = ${code}`;

    const [row] = await this.db
      .select({
        nameTaken: sql<boolean>`coalesce(bool_or(${nameMatch}), false)`,
        codeTaken: sql<boolean>`coalesce(bool_or(${codeMatch}), false)`,
      })
      .from(dimensionTemplates)
      .where(or(nameMatch, codeMatch));

    return row ?? { nameTaken: false, codeTaken: false };
  }

  // Returns the template matching a name within the caller's own ownership slot, if any
  async findOwnedByName(name: string): Promise<DimensionTemplate | undefined> {
    const [row] = await this.db
      .select()
      .from(dimensionTemplates)
      .where(sql`lower(${dimensionTemplates.name}) = lower(${name}) and ${ownedByWorkspace()}`)
      .limit(1);
    return row;
  }

  // Returns values for the given template ids in one query, keyed by template id (ordered by sortOrder)
  async findValuesByTemplateIds(ids: string[]): Promise<Map<string, DimensionTemplateValue[]>> {
    const byTemplate = new Map<string, DimensionTemplateValue[]>();
    if (ids.length === 0) return byTemplate;
    const rows = await this.db
      .select()
      .from(dimensionTemplateValues)
      .where(inArray(dimensionTemplateValues.templateId, ids))
      .orderBy(dimensionTemplateValues.sortOrder, dimensionTemplateValues.value);
    for (const row of rows) {
      const list = byTemplate.get(row.templateId) ?? [];
      list.push(row);
      byTemplate.set(row.templateId, list);
    }
    return byTemplate;
  }

  // Returns values for a specific template
  async findValuesByTemplateId(templateId: string): Promise<DimensionTemplateValue[]> {
    return this.db
      .select()
      .from(dimensionTemplateValues)
      .where(eq(dimensionTemplateValues.templateId, templateId))
      .orderBy(dimensionTemplateValues.sortOrder, dimensionTemplateValues.value);
  }
}

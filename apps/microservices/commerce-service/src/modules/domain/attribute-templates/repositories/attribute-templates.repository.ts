import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { asc, eq, getColumns, inArray, or, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type AttributeTemplate,
  type AttributeTemplateValue,
  attributeTemplates,
  attributeTemplateValues,
  ownedByWorkspaceExpression,
} from '@/db/schema';

export type AttributeTemplateWithOwnership = AttributeTemplate & { isOwned: boolean };

@Injectable()
export class AttributeTemplatesDomainRepository extends PrimaryBaseRepository<typeof attributeTemplates> {
  constructor(database: PrimaryDatabaseService) {
    super(database, attributeTemplates);
  }

  // Returns the templates this workspace can reach, each flagged with whether it owns the row or
  // merely inherits it from a wider scope (RLS decides reach; the expression decides ownership)
  async findAll(where?: SQL): Promise<AttributeTemplateWithOwnership[]> {
    return this.db
      .select({ ...getColumns(attributeTemplates), isOwned: ownedByWorkspaceExpression() })
      .from(attributeTemplates)
      .where(where)
      .orderBy(asc(attributeTemplates.name));
  }

  // Returns one template with its ownership flag, or undefined when out of reach. Callers that may
  // only write branch on isOwned rather than narrowing here, so a row owned elsewhere still yields
  // the name their 403 needs — RLS is what actually refuses the write.
  async findByIdWithOwnership(id: string): Promise<AttributeTemplateWithOwnership | undefined> {
    return this.findById<AttributeTemplateWithOwnership>(id, {
      select: { ...getColumns(attributeTemplates), isOwned: ownedByWorkspaceExpression() },
    });
  }

  // Reports which of the two unique keys are already taken, in one pass. They have different scopes:
  // name is unique per OWNER, code per ORGANIZATION — so an org-owned code blocks an LE too, while an
  // org-owned name does not. A single row may collide on both, hence bool_or rather than a row lookup.
  async findConflicts(name: string, code: string): Promise<{ nameTaken: boolean; codeTaken: boolean }> {
    const nameMatch = sql`lower(${attributeTemplates.name}) = lower(${name}) and ${ownedByWorkspaceExpression()}`;
    const codeMatch = sql`${attributeTemplates.code} = ${code}`;

    const [row] = await this.db
      .select({
        nameTaken: sql<boolean>`coalesce(bool_or(${nameMatch}), false)`,
        codeTaken: sql<boolean>`coalesce(bool_or(${codeMatch}), false)`,
      })
      .from(attributeTemplates)
      .where(or(nameMatch, codeMatch));

    return row ?? { nameTaken: false, codeTaken: false };
  }

  // Returns the template matching a name within this workspace's own ownership slot. Scoped to owned
  // rows because name is unique per OWNER, not per organization — an inherited row sharing the name
  // is not a collision.
  async findByName(name: string): Promise<AttributeTemplate | undefined> {
    const [row] = await this.db
      .select()
      .from(attributeTemplates)
      .where(sql`lower(${attributeTemplates.name}) = lower(${name}) and ${ownedByWorkspaceExpression()}`)
      .limit(1);
    return row;
  }

  // Returns values for the given template ids in one query, keyed by template id (ordered by sortOrder)
  async findValuesByTemplateIds(ids: string[]): Promise<Map<string, AttributeTemplateValue[]>> {
    const byTemplate = new Map<string, AttributeTemplateValue[]>();
    if (ids.length === 0) return byTemplate;
    const rows = await this.db
      .select()
      .from(attributeTemplateValues)
      .where(inArray(attributeTemplateValues.templateId, ids))
      .orderBy(attributeTemplateValues.sortOrder, attributeTemplateValues.value);
    for (const row of rows) {
      const list = byTemplate.get(row.templateId) ?? [];
      list.push(row);
      byTemplate.set(row.templateId, list);
    }
    return byTemplate;
  }

  // Returns values for a specific template
  async findValuesByTemplateId(templateId: string): Promise<AttributeTemplateValue[]> {
    return this.db
      .select()
      .from(attributeTemplateValues)
      .where(eq(attributeTemplateValues.templateId, templateId))
      .orderBy(attributeTemplateValues.sortOrder, attributeTemplateValues.value);
  }
}

import { Injectable } from '@nestjs/common';
import { MAX_PAGE_SIZE, PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { asc, eq, getColumns, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { ForbiddenException, NotFoundException } from '@vritti/api-sdk/exceptions';
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
      .orderBy(asc(dimensionTemplates.name))
      .limit(MAX_PAGE_SIZE);
  }

  // Loads a template by ID, throwing if the workspace cannot reach it — and, when requireOwned is
  // set, if it can only see the row because a wider scope owns it
  async findById(id: string, options: { requireOwned?: boolean } = {}): Promise<DimensionTemplateWithOwnership> {
    const [row] = await this.db
      .select({ ...getColumns(dimensionTemplates), isOwned: ownedByWorkspace() })
      .from(dimensionTemplates)
      .where(eq(dimensionTemplates.id, id))
      .limit(1);

    if (!row) throw new NotFoundException('Dimension template not found.');
    if (options.requireOwned && !row.isOwned) {
      throw new ForbiddenException({
        label: 'Not Your Template',
        detail: `"${row.name}" belongs to a wider scope. Switch to the workspace that owns it, or create your own.`,
      });
    }
    return row;
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

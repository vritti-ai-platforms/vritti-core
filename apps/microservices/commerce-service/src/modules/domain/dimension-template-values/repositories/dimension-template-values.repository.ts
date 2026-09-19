import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type DimensionTemplateValue,
  dimensionTemplates,
  dimensionTemplateValues,
  ownedByWorkspace,
} from '@/db/schema';

export type TemplateSummary = { id: string; name: string; isActive: boolean; isOwned: boolean };

@Injectable()
export class DimensionTemplateValuesDomainRepository extends PrimaryBaseRepository<typeof dimensionTemplateValues> {
  constructor(database: PrimaryDatabaseService) {
    super(database, dimensionTemplateValues);
  }

  // Returns the owning template, or undefined when out of reach. Pass requireOwned to narrow the
  // lookup to templates this workspace owns. Read here rather than by injecting the templates
  // domain, because a domain module never depends on a sibling.
  async findTemplate(
    templateId: string,
    options: { requireOwned?: boolean } = {},
  ): Promise<TemplateSummary | undefined> {
    const [row] = await this.db
      .select({
        id: dimensionTemplates.id,
        name: dimensionTemplates.name,
        isActive: dimensionTemplates.isActive,
        isOwned: ownedByWorkspace(),
      })
      .from(dimensionTemplates)
      .where(
        options.requireOwned
          ? and(eq(dimensionTemplates.id, templateId), sql`${ownedByWorkspace()}`)
          : eq(dimensionTemplates.id, templateId),
      )
      .limit(1);
    return row;
  }

  // Switches the owning template off — used when its last value is removed
  async deactivateTemplate(templateId: string): Promise<void> {
    await this.db.update(dimensionTemplates).set({ isActive: false }).where(eq(dimensionTemplates.id, templateId));
  }

  async createValues(
    rows: { templateId: string; code: string; value: string; sortOrder: number }[],
  ): Promise<DimensionTemplateValue[]> {
    if (rows.length === 0) return [];
    return this.db.insert(dimensionTemplateValues).values(rows).returning();
  }

  async deleteAllForTemplate(templateId: string): Promise<void> {
    await this.db.delete(dimensionTemplateValues).where(eq(dimensionTemplateValues.templateId, templateId));
  }
}

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { ForbiddenException, NotFoundException } from '@vritti/api-sdk/exceptions';
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

  // Loads the owning template, throwing if the workspace cannot reach it — and, when requireOwned is
  // set, if it can only see the row because a wider scope owns it. Read here rather than by injecting
  // the templates domain, because a domain module never depends on a sibling.
  async findTemplate(templateId: string, options: { requireOwned?: boolean } = {}): Promise<TemplateSummary> {
    const [row] = await this.db
      .select({
        id: dimensionTemplates.id,
        name: dimensionTemplates.name,
        isActive: dimensionTemplates.isActive,
        isOwned: ownedByWorkspace(),
      })
      .from(dimensionTemplates)
      .where(eq(dimensionTemplates.id, templateId))
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

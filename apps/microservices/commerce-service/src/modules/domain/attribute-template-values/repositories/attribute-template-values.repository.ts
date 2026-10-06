import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import {
  type AttributeTemplateValue,
  attributeTemplates,
  attributeTemplateValues,
  ownedByWorkspaceExpression,
} from '@/db/schema';

export type TemplateSummary = { id: string; name: string; isActive: boolean; isOwned: boolean };

@Injectable()
export class AttributeTemplateValuesDomainRepository extends PrimaryBaseRepository<typeof attributeTemplateValues> {
  constructor(database: PrimaryDatabaseService) {
    super(database, attributeTemplateValues);
  }

  // Returns the owning template with its ownership flag, or undefined when out of reach. Read here
  // rather than by injecting the templates domain, because a domain module never depends on a sibling.
  async findTemplate(templateId: string): Promise<TemplateSummary | undefined> {
    const [row] = await this.db
      .select({
        id: attributeTemplates.id,
        name: attributeTemplates.name,
        isActive: attributeTemplates.isActive,
        isOwned: ownedByWorkspaceExpression(),
      })
      .from(attributeTemplates)
      .where(eq(attributeTemplates.id, templateId))
      .limit(1);
    return row;
  }

  // Switches the owning template off — used when its last value is removed
  async deactivateTemplate(templateId: string): Promise<void> {
    await this.db.update(attributeTemplates).set({ isActive: false }).where(eq(attributeTemplates.id, templateId));
  }

  async createValues(
    rows: { templateId: string; code: string; value: string; sortOrder: number }[],
  ): Promise<AttributeTemplateValue[]> {
    if (rows.length === 0) return [];
    return this.db.insert(attributeTemplateValues).values(rows).returning();
  }

  async deleteAllForTemplate(templateId: string): Promise<void> {
    await this.db.delete(attributeTemplateValues).where(eq(attributeTemplateValues.templateId, templateId));
  }
}

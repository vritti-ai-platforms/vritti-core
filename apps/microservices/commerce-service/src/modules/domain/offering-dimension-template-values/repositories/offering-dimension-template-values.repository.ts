import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import {
  type OfferingDimensionTemplate,
  type OfferingDimensionTemplateValue,
  offeringDimensionTemplates,
  offeringDimensionTemplateValues,
  ownedByWorkspace,
} from '@/db/schema';

export type ParentTemplate = OfferingDimensionTemplate & { isOwned: boolean };

@Injectable()
export class OfferingDimensionTemplateValuesDomainRepository extends PrimaryBaseRepository<
  typeof offeringDimensionTemplateValues
> {
  constructor(database: PrimaryDatabaseService) {
    super(database, offeringDimensionTemplateValues);
  }

  // Reads the parent template through this repository rather than injecting the templates domain —
  // a domain module never depends on a sibling, so its own cross-table reads live here.
  async findParentTemplate(templateId: string): Promise<ParentTemplate | undefined> {
    const [row] = await this.db
      .select({
        id: offeringDimensionTemplates.id,
        organizationId: offeringDimensionTemplates.organizationId,
        legalEntityId: offeringDimensionTemplates.legalEntityId,
        siteId: offeringDimensionTemplates.siteId,
        code: offeringDimensionTemplates.code,
        name: offeringDimensionTemplates.name,
        description: offeringDimensionTemplates.description,
        sortOrder: offeringDimensionTemplates.sortOrder,
        isActive: offeringDimensionTemplates.isActive,
        createdAt: offeringDimensionTemplates.createdAt,
        updatedAt: offeringDimensionTemplates.updatedAt,
        isOwned: ownedByWorkspace(),
      })
      .from(offeringDimensionTemplates)
      .where(eq(offeringDimensionTemplates.id, templateId))
      .limit(1);
    return row;
  }

  // Switches the parent template off — used when its last value is removed
  async deactivateTemplate(templateId: string): Promise<void> {
    await this.db
      .update(offeringDimensionTemplates)
      .set({ isActive: false })
      .where(eq(offeringDimensionTemplates.id, templateId));
  }

  async createValues(
    rows: { templateId: string; code: string; value: string; sortOrder: number }[],
  ): Promise<OfferingDimensionTemplateValue[]> {
    if (rows.length === 0) return [];
    return this.db.insert(offeringDimensionTemplateValues).values(rows).returning();
  }

  async deleteAllForTemplate(templateId: string): Promise<void> {
    await this.db
      .delete(offeringDimensionTemplateValues)
      .where(eq(offeringDimensionTemplateValues.templateId, templateId));
  }
}

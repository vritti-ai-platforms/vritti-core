import { Injectable } from '@nestjs/common';
import { MAX_PAGE_SIZE, PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { asc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type OfferingDimensionTemplate,
  type OfferingDimensionTemplateValue,
  offeringDimensionTemplates,
  offeringDimensionTemplateValues,
  ownedByWorkspace,
} from '@/db/schema';

export type TemplateWithMeta = OfferingDimensionTemplate & { isOwned: boolean };

@Injectable()
export class OfferingDimensionTemplatesDomainRepository extends PrimaryBaseRepository<
  typeof offeringDimensionTemplates
> {
  constructor(database: PrimaryDatabaseService) {
    super(database, offeringDimensionTemplates);
  }

  private static selection() {
    return {
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
    };
  }

  // Returns every reachable template with ownership and value counts (RLS scopes the rows)
  async findAllWithMeta(where?: SQL): Promise<TemplateWithMeta[]> {
    const { result } = await this.findAllAndCount<TemplateWithMeta>({
      select: OfferingDimensionTemplatesDomainRepository.selection(),
      where,
      orderBy: [asc(offeringDimensionTemplates.sortOrder), asc(offeringDimensionTemplates.name)],
      limit: MAX_PAGE_SIZE,
      offset: 0,
    });
    return result;
  }

  // Returns a single template with ownership and value count, or undefined when out of reach
  async findByIdWithMeta(id: string): Promise<TemplateWithMeta | undefined> {
    const { result } = await this.findAllAndCount<TemplateWithMeta>({
      select: OfferingDimensionTemplatesDomainRepository.selection(),
      where: eq(offeringDimensionTemplates.id, id),
      orderBy: [asc(offeringDimensionTemplates.name)],
      limit: 1,
      offset: 0,
    });
    return result[0];
  }

  // Returns the name-collision row within the caller's own ownership slot, if any
  async findOwnedByName(name: string): Promise<OfferingDimensionTemplate | undefined> {
    const [row] = await this.db
      .select()
      .from(offeringDimensionTemplates)
      .where(sql`lower(${offeringDimensionTemplates.name}) = lower(${name}) and ${ownedByWorkspace()}`)
      .limit(1);
    return row;
  }

  // Returns values for one template ordered by sortOrder
  async findValues(templateId: string): Promise<OfferingDimensionTemplateValue[]> {
    return this.db
      .select()
      .from(offeringDimensionTemplateValues)
      .where(eq(offeringDimensionTemplateValues.templateId, templateId))
      .orderBy(offeringDimensionTemplateValues.sortOrder, offeringDimensionTemplateValues.value);
  }

  // Returns values for many templates in one round trip
  async findValuesForTemplates(templateIds: string[]): Promise<OfferingDimensionTemplateValue[]> {
    if (templateIds.length === 0) return [];
    return this.db
      .select()
      .from(offeringDimensionTemplateValues)
      .where(inArray(offeringDimensionTemplateValues.templateId, templateIds))
      .orderBy(offeringDimensionTemplateValues.sortOrder, offeringDimensionTemplateValues.value);
  }
}

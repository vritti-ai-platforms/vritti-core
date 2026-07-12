import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq, sql } from '@vritti/api-sdk/drizzle-orm';
import { type LegalEntity, legalEntities, sites } from '@/db/schema';

@Injectable()
export class LegalEntityRepository extends PrimaryBaseRepository<typeof legalEntities> {
  constructor(database: PrimaryDatabaseService) {
    super(database, legalEntities);
  }

  // Finds all legal entities for an organization ordered by creation time
  async findByOrg(orgId: string): Promise<LegalEntity[]> {
    return this.model.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Finds a legal entity by organization and code
  async findByOrgAndCode(orgId: string, code: string): Promise<LegalEntity | undefined> {
    return this.model.findFirst({
      where: { organizationId: orgId, code },
    });
  }

  // Counts child legal entities of a parent legal entity
  async countChildren(parentId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(legalEntities)
      .where(eq(legalEntities.parentId, parentId));
    return (result[0] as { count: number }).count;
  }

  // Counts sites linked to a legal entity
  async countSitesByLegalEntity(legalEntityId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(sites)
      .where(eq(sites.legalEntityId, legalEntityId));
    return (result[0] as { count: number }).count;
  }
}

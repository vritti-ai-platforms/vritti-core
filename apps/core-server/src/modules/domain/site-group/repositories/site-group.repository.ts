import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq, sql } from '@vritti/api-sdk/drizzle-orm';
import { type SiteGroup, siteGroups, sites } from '@/db/schema';

@Injectable()
export class SiteGroupRepository extends PrimaryBaseRepository<typeof siteGroups> {
  constructor(database: PrimaryDatabaseService) {
    super(database, siteGroups);
  }

  // Finds all site groups for an organization
  async findByOrg(orgId: string): Promise<SiteGroup[]> {
    return this.model.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    });
  }

  // Finds a site group by organization and code
  async findByOrgAndCode(orgId: string, code: string): Promise<SiteGroup | undefined> {
    return this.model.findFirst({
      where: { organizationId: orgId, code },
    });
  }

  // Counts child groups of a site group
  async countChildren(parentId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(siteGroups)
      .where(eq(siteGroups.parentId, parentId));
    return (result[0] as { count: number }).count;
  }

  // Counts sites that are members of a site group
  async countMemberSites(groupId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(sites)
      .where(eq(sites.groupId, groupId));
    return (result[0] as { count: number }).count;
  }
}

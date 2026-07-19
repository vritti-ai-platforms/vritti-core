import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { type Organization, organizations, sites } from '@/db/schema';

@Injectable()
export class OrganizationDomainRepository extends PrimaryBaseRepository<typeof organizations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, organizations);
  }

  // Finds an organization by its subdomain
  async findBySubdomain(subdomain: string): Promise<Organization | undefined> {
    return this.model.findFirst({ where: { subdomain } });
  }

  // Returns the ids of all sites belonging to an organization
  async findSiteIds(orgId: string): Promise<string[]> {
    const rows = await this.db.select({ id: sites.id }).from(sites).where(eq(sites.organizationId, orgId));
    return rows.map((r) => r.id);
  }
}

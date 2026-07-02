import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { eq } from '@vritti/api-sdk/drizzle-orm';
import { businessUnits, type Organization, organizations } from '@/db/schema';

@Injectable()
export class OrganizationRepository extends PrimaryBaseRepository<typeof organizations> {
  constructor(database: PrimaryDatabaseService) {
    super(database, organizations);
  }

  // Finds an organization by its subdomain
  async findBySubdomain(subdomain: string): Promise<Organization | undefined> {
    return this.model.findFirst({ where: { subdomain } });
  }

  // Returns the ids of all business units belonging to an organization
  async findBusinessUnitIds(orgId: string): Promise<string[]> {
    const rows = await this.db
      .select({ id: businessUnits.id })
      .from(businessUnits)
      .where(eq(businessUnits.organizationId, orgId));
    return rows.map((r) => r.id);
  }
}

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq } from '@vritti/api-sdk/drizzle-orm';
import { type OrgService, orgServices, type ServiceType } from '@/db/schema';

@Injectable()
export class OrgServiceDomainRepository extends PrimaryBaseRepository<typeof orgServices> {
  constructor(database: PrimaryDatabaseService) {
    super(database, orgServices);
  }

  // Returns every service the organization has provisioned
  async findByOrg(orgId: string): Promise<OrgService[]> {
    return this.model.findMany({ where: { organizationId: orgId } });
  }

  // Returns the organization's entry for one service, or undefined when it is not provisioned
  async findByOrgAndService(orgId: string, service: ServiceType): Promise<OrgService | undefined> {
    return this.model.findFirst({ where: { organizationId: orgId, service } });
  }

  // Records a provisioned service, refreshing the provider's identifiers when the row already exists
  async upsert(
    orgId: string,
    service: ServiceType,
    values: { externalId?: string | null; externalName?: string | null },
  ): Promise<OrgService> {
    const rows = (await this.db
      .insert(orgServices)
      .values({ organizationId: orgId, service, ...values })
      .onConflictDoUpdate({
        target: [orgServices.organizationId, orgServices.service],
        set: { ...values, updatedAt: new Date() },
      })
      .returning()) as OrgService[];
    return rows[0];
  }

  // Drops a provisioned service, re-locking every feature that depends on it
  async removeByOrgAndService(orgId: string, service: ServiceType): Promise<void> {
    await this.db
      .delete(orgServices)
      .where(and(eq(orgServices.organizationId, orgId), eq(orgServices.service, service)));
  }
}

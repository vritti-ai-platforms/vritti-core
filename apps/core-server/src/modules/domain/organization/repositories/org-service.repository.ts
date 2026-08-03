import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
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

  // Records a provisioned service, refreshing the provider's identifiers when the row already exists.
  // Only the keys the caller supplied are written — a re-provision carrying one identifier must not
  // null the other, because a blank externalName silently re-locks every feature gated on the service.
  async upsert(
    orgId: string,
    service: ServiceType,
    values: { externalId?: string | null; externalName?: string | null },
  ): Promise<OrgService> {
    const supplied = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));

    const rows = (await this.db
      .insert(orgServices)
      .values({ organizationId: orgId, service, ...supplied })
      .onConflictDoUpdate({
        target: [orgServices.organizationId, orgServices.service],
        set: { ...supplied, updatedAt: new Date() },
      })
      .returning()) as OrgService[];
    return rows[0];
  }
}

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { type OrgRole, orgRoles } from '@/db/schema';

@Injectable()
export class OrgRoleRepository extends PrimaryBaseRepository<typeof orgRoles> {
  constructor(database: PrimaryDatabaseService) {
    super(database, orgRoles);
  }

  // Finds all roles for an organization
  async findByOrg(orgId: string): Promise<OrgRole[]> {
    return this.model.findMany({
      where: { organizationId: orgId },
    });
  }

  // Finds a role by organization ID and name for uniqueness check
  async findByOrgAndName(orgId: string, name: string): Promise<OrgRole | undefined> {
    return this.model.findFirst({
      where: { organizationId: orgId, name },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { type Role, roles } from '@/db/schema';

@Injectable()
export class RoleRepository extends PrimaryBaseRepository<typeof roles> {
  constructor(database: PrimaryDatabaseService) {
    super(database, roles);
  }

  // Finds all roles for an organization
  async findByOrg(orgId: string): Promise<Role[]> {
    return this.model.findMany({
      where: { organizationId: orgId },
    });
  }

  // Finds a role by organization ID and name for uniqueness check
  async findByOrgAndName(orgId: string, name: string): Promise<Role | undefined> {
    return this.model.findFirst({
      where: { organizationId: orgId, name },
    });
  }

  // Returns the set of source role template IDs already provisioned for an organization
  async findSourceRoleIdsByOrg(orgId: string): Promise<string[]> {
    const rows = await this.model.findMany({
      where: { organizationId: orgId },
      columns: { sourceRoleId: true },
    });
    return rows.map((r) => r.sourceRoleId).filter((id): id is string => Boolean(id));
  }
}

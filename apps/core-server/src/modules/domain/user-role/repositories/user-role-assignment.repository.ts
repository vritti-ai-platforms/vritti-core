import { Injectable } from '@nestjs/common';
import type { FeatureUnlocks, RevokedGrants } from '@vritti/api-sdk/catalog-resolver';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, eq, isNull, type SQL } from '@vritti/api-sdk/drizzle-orm';
import {
  type LegalEntity,
  legalEntities,
  roles,
  type SiteGroup,
  siteGroups,
  type UserRoleAssignment,
  userRoleAssignments,
  users,
} from '@/db/schema';

export interface AssignmentRoleGrants {
  features: FeatureUnlocks;
  code: string;
  name: string;
  revoked: RevokedGrants | null;
  siteId: string | null;
  siteGroupId: string | null;
  legalEntityId: string | null;
}

export type AssignmentWithNames = UserRoleAssignment & { userName: string; userEmail: string; roleName: string };

@Injectable()
export class UserRoleAssignmentRepository extends PrimaryBaseRepository<typeof userRoleAssignments> {
  constructor(database: PrimaryDatabaseService) {
    super(database, userRoleAssignments);
  }

  // Finds all role assignments for a user with the role name
  async findByUser(userId: string): Promise<(UserRoleAssignment & { roleName: string })[]> {
    const rows = await this.db
      .select({
        id: userRoleAssignments.id,
        userId: userRoleAssignments.userId,
        roleId: userRoleAssignments.roleId,
        siteId: userRoleAssignments.siteId,
        siteGroupId: userRoleAssignments.siteGroupId,
        legalEntityId: userRoleAssignments.legalEntityId,
        assignmentType: userRoleAssignments.assignmentType,
        grantedBy: userRoleAssignments.grantedBy,
        isActive: userRoleAssignments.isActive,
        createdAt: userRoleAssignments.createdAt,
        updatedAt: userRoleAssignments.updatedAt,
        roleName: roles.name,
      })
      .from(userRoleAssignments)
      .innerJoin(roles, eq(roles.id, userRoleAssignments.roleId))
      .where(eq(userRoleAssignments.userId, userId));

    return rows as (UserRoleAssignment & { roleName: string })[];
  }

  // Finds all role assignments directly targeting a site with user and role names
  async findBySite(siteId: string): Promise<AssignmentWithNames[]> {
    return this.findWithNames(eq(userRoleAssignments.siteId, siteId));
  }

  // Finds all role assignments directly targeting a site group with user and role names
  async findBySiteGroup(siteGroupId: string): Promise<AssignmentWithNames[]> {
    return this.findWithNames(eq(userRoleAssignments.siteGroupId, siteGroupId));
  }

  // Finds all role assignments directly targeting a legal entity with user and role names
  async findByLegalEntity(legalEntityId: string): Promise<AssignmentWithNames[]> {
    return this.findWithNames(eq(userRoleAssignments.legalEntityId, legalEntityId));
  }

  // Finds all org-wide role assignments (no site, group, or legal entity target) with user and role names
  async findOrgWide(orgId: string): Promise<AssignmentWithNames[]> {
    return this.findWithNames(
      and(
        eq(roles.organizationId, orgId),
        isNull(userRoleAssignments.siteId),
        isNull(userRoleAssignments.siteGroupId),
        isNull(userRoleAssignments.legalEntityId),
      ),
    );
  }

  // Selects assignment rows joined with user and role names for the given condition
  private async findWithNames(condition: SQL | undefined): Promise<AssignmentWithNames[]> {
    const rows = await this.db
      .select({
        id: userRoleAssignments.id,
        userId: userRoleAssignments.userId,
        roleId: userRoleAssignments.roleId,
        siteId: userRoleAssignments.siteId,
        siteGroupId: userRoleAssignments.siteGroupId,
        legalEntityId: userRoleAssignments.legalEntityId,
        assignmentType: userRoleAssignments.assignmentType,
        grantedBy: userRoleAssignments.grantedBy,
        isActive: userRoleAssignments.isActive,
        createdAt: userRoleAssignments.createdAt,
        updatedAt: userRoleAssignments.updatedAt,
        userName: users.fullName,
        userEmail: users.email,
        roleName: roles.name,
      })
      .from(userRoleAssignments)
      .innerJoin(users, eq(users.id, userRoleAssignments.userId))
      .innerJoin(roles, eq(roles.id, userRoleAssignments.roleId))
      .where(condition);

    return rows as AssignmentWithNames[];
  }

  // Finds all role assignments for a user with each role's grants and target columns
  async findGrantsByUser(userId: string): Promise<AssignmentRoleGrants[]> {
    return this.db
      .select({
        features: roles.features,
        code: roles.code,
        name: roles.name,
        revoked: roles.revoked,
        siteId: userRoleAssignments.siteId,
        siteGroupId: userRoleAssignments.siteGroupId,
        legalEntityId: userRoleAssignments.legalEntityId,
      })
      .from(userRoleAssignments)
      .innerJoin(roles, eq(roles.id, userRoleAssignments.roleId))
      .where(eq(userRoleAssignments.userId, userId));
  }

  // Finds a site group by ID for assignment-target validation
  async findSiteGroupById(id: string): Promise<SiteGroup | undefined> {
    const rows = await this.db.select().from(siteGroups).where(eq(siteGroups.id, id)).limit(1);
    return rows[0];
  }

  // Finds a legal entity by ID for assignment-target validation
  async findLegalEntityById(id: string): Promise<LegalEntity | undefined> {
    const rows = await this.db.select().from(legalEntities).where(eq(legalEntities.id, id)).limit(1);
    return rows[0];
  }

  // Finds the user's single assignment for an exact target (one role per user per target)
  async findByUserAndTarget(
    userId: string,
    target: { siteId: string | null; siteGroupId: string | null; legalEntityId: string | null },
  ): Promise<UserRoleAssignment | undefined> {
    const rows = await this.db
      .select()
      .from(userRoleAssignments)
      .where(
        and(
          eq(userRoleAssignments.userId, userId),
          target.siteId ? eq(userRoleAssignments.siteId, target.siteId) : isNull(userRoleAssignments.siteId),
          target.siteGroupId
            ? eq(userRoleAssignments.siteGroupId, target.siteGroupId)
            : isNull(userRoleAssignments.siteGroupId),
          target.legalEntityId
            ? eq(userRoleAssignments.legalEntityId, target.legalEntityId)
            : isNull(userRoleAssignments.legalEntityId),
        ),
      )
      .limit(1);
    return rows[0] as UserRoleAssignment | undefined;
  }
  // Finds user ids holding any assignment in a legal entity's organization for SSE re-push fan-out
  async findUserIdsByLegalEntityOrg(legalEntityId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ userId: userRoleAssignments.userId })
      .from(userRoleAssignments)
      .innerJoin(roles, eq(roles.id, userRoleAssignments.roleId))
      .innerJoin(legalEntities, eq(legalEntities.organizationId, roles.organizationId))
      .where(eq(legalEntities.id, legalEntityId));
    return rows.map((r) => r.userId);
  }

  // Finds user ids holding any assignment in a site group's organization for SSE re-push fan-out
  async findUserIdsBySiteGroupOrg(siteGroupId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ userId: userRoleAssignments.userId })
      .from(userRoleAssignments)
      .innerJoin(roles, eq(roles.id, userRoleAssignments.roleId))
      .innerJoin(siteGroups, eq(siteGroups.organizationId, roles.organizationId))
      .where(eq(siteGroups.id, siteGroupId));
    return rows.map((r) => r.userId);
  }
}

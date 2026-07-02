import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import type { RevokedGrants } from '@vritti/api-sdk/catalog-resolver';
import { and, eq } from '@vritti/api-sdk/drizzle-orm';
import { businessUnits, roles, type UserRoleAssignment, userRoleAssignments, users } from '@/db/schema';

@Injectable()
export class UserRoleAssignmentRepository extends PrimaryBaseRepository<typeof userRoleAssignments> {
  constructor(database: PrimaryDatabaseService) {
    super(database, userRoleAssignments);
  }

  // Finds all role assignments for a user with role and business unit names
  async findByUser(userId: string): Promise<(UserRoleAssignment & { roleName: string; businessUnitName: string })[]> {
    const rows = await this.db
      .select({
        id: userRoleAssignments.id,
        userId: userRoleAssignments.userId,
        roleId: userRoleAssignments.roleId,
        businessUnitId: userRoleAssignments.businessUnitId,
        assignmentType: userRoleAssignments.assignmentType,
        grantedBy: userRoleAssignments.grantedBy,
        isActive: userRoleAssignments.isActive,
        createdAt: userRoleAssignments.createdAt,
        updatedAt: userRoleAssignments.updatedAt,
        roleName: roles.name,
        businessUnitName: businessUnits.name,
      })
      .from(userRoleAssignments)
      .innerJoin(roles, eq(roles.id, userRoleAssignments.roleId))
      .innerJoin(businessUnits, eq(businessUnits.id, userRoleAssignments.businessUnitId))
      .where(eq(userRoleAssignments.userId, userId));

    return rows as (UserRoleAssignment & { roleName: string; businessUnitName: string })[];
  }

  // Finds all role assignments for a business unit with user and role names
  async findByBusinessUnit(
    buId: string,
  ): Promise<(UserRoleAssignment & { userName: string; userEmail: string; roleName: string })[]> {
    const rows = await this.db
      .select({
        id: userRoleAssignments.id,
        userId: userRoleAssignments.userId,
        roleId: userRoleAssignments.roleId,
        businessUnitId: userRoleAssignments.businessUnitId,
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
      .where(eq(userRoleAssignments.businessUnitId, buId));

    return rows as (UserRoleAssignment & { userName: string; userEmail: string; roleName: string })[];
  }

  // Finds all role assignments for a user at a specific BU, returning each role's grants + inheritance fields
  async findByUserAndBU(
    userId: string,
    buId: string,
  ): Promise<{ features: Record<string, string[]>; code: string; revoked: RevokedGrants | null }[]> {
    const rows = await this.db
      .select({
        features: roles.features,
        code: roles.code,
        revoked: roles.revoked,
      })
      .from(userRoleAssignments)
      .innerJoin(roles, eq(roles.id, userRoleAssignments.roleId))
      .where(and(eq(userRoleAssignments.userId, userId), eq(userRoleAssignments.businessUnitId, buId)));

    return rows as unknown as {
      features: Record<string, string[]>;
      code: string;
      revoked: RevokedGrants | null;
    }[];
  }

  // Finds the user's single assignment within a business unit (one role per user per BU)
  async findAssignmentByUserAndBU(userId: string, buId: string): Promise<UserRoleAssignment | undefined> {
    return this.model.findFirst({
      where: { userId, businessUnitId: buId },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk';
import { and, eq } from '@vritti/api-sdk/drizzle-orm';
import {
  type UserRoleAssignment,
  businessUnits,
  orgRoles,
  userRoleAssignments,
  users,
} from '@/db/schema';

@Injectable()
export class UserRoleAssignmentRepository extends PrimaryBaseRepository<typeof userRoleAssignments> {
  constructor(database: PrimaryDatabaseService) {
    super(database, userRoleAssignments);
  }

  // Finds all role assignments for a user with role and business unit names
  async findByUser(userId: string): Promise<
    (UserRoleAssignment & { roleName: string; businessUnitName: string })[]
  > {
    const rows = await this.db
      .select({
        id: userRoleAssignments.id,
        userId: userRoleAssignments.userId,
        orgRoleId: userRoleAssignments.orgRoleId,
        businessUnitId: userRoleAssignments.businessUnitId,
        assignmentType: userRoleAssignments.assignmentType,
        grantedBy: userRoleAssignments.grantedBy,
        isActive: userRoleAssignments.isActive,
        createdAt: userRoleAssignments.createdAt,
        updatedAt: userRoleAssignments.updatedAt,
        roleName: orgRoles.name,
        businessUnitName: businessUnits.name,
      })
      .from(userRoleAssignments)
      .innerJoin(orgRoles, eq(orgRoles.id, userRoleAssignments.orgRoleId))
      .innerJoin(businessUnits, eq(businessUnits.id, userRoleAssignments.businessUnitId))
      .where(eq(userRoleAssignments.userId, userId));

    return rows as (UserRoleAssignment & { roleName: string; businessUnitName: string })[];
  }

  // Finds all role assignments for a business unit with user and role names
  async findByBusinessUnit(buId: string): Promise<
    (UserRoleAssignment & { userName: string; userEmail: string; roleName: string })[]
  > {
    const rows = await this.db
      .select({
        id: userRoleAssignments.id,
        userId: userRoleAssignments.userId,
        orgRoleId: userRoleAssignments.orgRoleId,
        businessUnitId: userRoleAssignments.businessUnitId,
        assignmentType: userRoleAssignments.assignmentType,
        grantedBy: userRoleAssignments.grantedBy,
        isActive: userRoleAssignments.isActive,
        createdAt: userRoleAssignments.createdAt,
        updatedAt: userRoleAssignments.updatedAt,
        userName: users.fullName,
        userEmail: users.email,
        roleName: orgRoles.name,
      })
      .from(userRoleAssignments)
      .innerJoin(users, eq(users.id, userRoleAssignments.userId))
      .innerJoin(orgRoles, eq(orgRoles.id, userRoleAssignments.orgRoleId))
      .where(eq(userRoleAssignments.businessUnitId, buId));

    return rows as (UserRoleAssignment & { userName: string; userEmail: string; roleName: string })[];
  }

  // Finds all role assignments for a user at a specific BU, returning each role's features
  async findByUserAndBU(
    userId: string,
    buId: string,
  ): Promise<{ features: Record<string, string[]> }[]> {
    const rows = await this.db
      .select({
        features: orgRoles.features,
      })
      .from(userRoleAssignments)
      .innerJoin(orgRoles, eq(orgRoles.id, userRoleAssignments.orgRoleId))
      .where(and(eq(userRoleAssignments.userId, userId), eq(userRoleAssignments.businessUnitId, buId)));

    return rows as unknown as { features: Record<string, string[]> }[];
  }

  // Finds a specific assignment for duplicate check
  async findByUserAndRoleAndBU(
    userId: string,
    orgRoleId: string,
    buId: string,
  ): Promise<UserRoleAssignment | undefined> {
    return this.model.findFirst({
      where: { userId, orgRoleId, businessUnitId: buId },
    });
  }
}

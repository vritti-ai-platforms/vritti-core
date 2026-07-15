import { Injectable } from '@nestjs/common';
import type { ScopeType, SiteType } from '@vritti/api-sdk/catalog-resolver';
import {
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { countDistinct, eq, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type Role, roles, userRoleAssignments } from '@/db/schema';

export type RoleWithCount = Role & { assignedUserCount: number };
export type GroupedRoleRow = { scope: ScopeType; siteType: SiteType | null; roles: RoleWithCount[] };

@Injectable()
export class RoleRepository extends PrimaryBaseRepository<typeof roles> {
  constructor(database: PrimaryDatabaseService) {
    super(database, roles);
  }

  // Returns an org's roles matching an exact scope as select options; SITE scope also matches null or the given site type
  async findForSelectOptions(
    query: SelectOptionsQueryDto,
    orgId: string,
    scope: ScopeType,
    siteType?: SiteType,
  ): Promise<SelectQueryResult> {
    // roles has no RLS policy, so the org must be filtered explicitly
    const conditions: SQL[] = [];
    if (scope === 'SITE' && siteType) {
      conditions.push(sql`(${roles.siteType} is null or ${roles.siteType} = ${siteType})`);
    }

    return this.findForSelect({
      value: 'id',
      label: 'name',
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      where: { organizationId: orgId, scope },
      orderBy: { name: 'asc' },
      conditions,
    });
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

  // Groups the org's roles by scope (SITE further by site type), each role carrying its distinct assigned-user count
  async findByOrgGroupedByScope(orgId: string): Promise<GroupedRoleRow[]> {
    // Per-role distinct user counts, aggregated once so the outer scope grouping stays a single pass
    const userCounts = this.db.$with('user_counts').as(
      this.db
        .select({ roleId: userRoleAssignments.roleId, count: countDistinct(userRoleAssignments.userId).as('count') })
        .from(userRoleAssignments)
        .groupBy(userRoleAssignments.roleId),
    );

    return this.db
      .with(userCounts)
      .select({
        scope: roles.scope,
        siteType: roles.siteType,
        roles: sql<RoleWithCount[]>`jsonb_agg(
          jsonb_build_object(
            'id', ${roles.id},
            'organizationId', ${roles.organizationId},
            'name', ${roles.name},
            'description', ${roles.description},
            'code', ${roles.code},
            'scope', ${roles.scope},
            'siteType', ${roles.siteType},
            'features', ${roles.features},
            'revoked', ${roles.revoked},
            'isActive', ${roles.isActive},
            'assignedUserCount', coalesce(${userCounts.count}, 0),
            'createdAt', ${roles.createdAt},
            'updatedAt', ${roles.updatedAt}
          ) order by ${roles.name}
        )`,
      })
      .from(roles)
      .leftJoin(userCounts, eq(userCounts.roleId, roles.id))
      .where(eq(roles.organizationId, orgId))
      .groupBy(roles.scope, roles.siteType);
  }
}

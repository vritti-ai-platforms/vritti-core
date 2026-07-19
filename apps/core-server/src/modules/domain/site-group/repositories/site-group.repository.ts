import { Injectable } from '@nestjs/common';
import {
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { and, asc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type SiteGroup, siteGroups, sites } from '@/db/schema';

@Injectable()
export class SiteGroupDomainRepository extends PrimaryBaseRepository<typeof siteGroups> {
  constructor(database: PrimaryDatabaseService) {
    super(database, siteGroups);
  }

  // Returns site groups as select options, excluding a node and its descendant subtree entirely in SQL
  async findForSelectOptions(query: SelectOptionsQueryDto, excludeId?: string): Promise<SelectQueryResult> {
    const conditions: SQL[] = [];

    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(sql`(${siteGroups.name} ilike ${term} or ${siteGroups.code} ilike ${term})`);
    }

    if (excludeId) {
      conditions.push(sql`${siteGroups.id} not in (
        with recursive subtree as (
          select id, parent_id from ${siteGroups} where id = ${excludeId}
          union all
          select child.id, child.parent_id
          from ${siteGroups} child
          inner join subtree parent on child.parent_id = parent.id
        )
        select id from subtree
      )`);
    }

    return this.findForSelect({
      value: 'id',
      label: 'name',
      description: 'code',
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      orderBy: { name: 'asc' },
      conditions,
    });
  }

  // Finds all site groups for an organization
  async findByOrg(orgId: string): Promise<SiteGroup[]> {
    return this.model.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    });
  }

  // Finds a site group by organization and code
  async findByOrgAndCode(orgId: string, code: string): Promise<SiteGroup | undefined> {
    return this.model.findFirst({
      where: { organizationId: orgId, code },
    });
  }

  // Finds site groups by ids scoped to an organization
  async findByIds(orgId: string, ids: string[]): Promise<SiteGroup[]> {
    if (ids.length === 0) return [];
    return this.db
      .select()
      .from(siteGroups)
      .where(and(eq(siteGroups.organizationId, orgId), inArray(siteGroups.id, ids)));
  }

  // Returns a parent's sibling site groups, ordered
  async siblingsOrdered(orgId: string, parentId: string | null): Promise<SiteGroup[]> {
    return this.db
      .select()
      .from(siteGroups)
      .where(and(eq(siteGroups.organizationId, orgId), sql`${siteGroups.parentId} is not distinct from ${parentId}`))
      .orderBy(asc(siteGroups.sortOrder), asc(siteGroups.name));
  }

  // Returns the next sort order for a new sibling
  async nextSortOrder(orgId: string, parentId: string | null): Promise<number> {
    const result = await this.db
      .select({ max: sql<number>`coalesce(max(${siteGroups.sortOrder}), 0)::int` })
      .from(siteGroups)
      .where(and(eq(siteGroups.organizationId, orgId), sql`${siteGroups.parentId} is not distinct from ${parentId}`));
    return (result[0]?.max ?? 0) + 1;
  }

  // Applies new sort orders to a batch of site groups scoped to an organization
  async setSortOrders(orgId: string, entries: { id: string; sortOrder: number }[]): Promise<void> {
    await Promise.all(
      entries.map((entry) =>
        this.db
          .update(siteGroups)
          .set({ sortOrder: entry.sortOrder, updatedAt: new Date() })
          .where(and(eq(siteGroups.id, entry.id), eq(siteGroups.organizationId, orgId))),
      ),
    );
  }

  // Counts child groups of a site group
  async countChildren(parentId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(siteGroups)
      .where(eq(siteGroups.parentId, parentId));
    return (result[0] as { count: number }).count;
  }

  // Counts sites that are members of a site group
  async countMemberSites(groupId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(sites)
      .where(eq(sites.groupId, groupId));
    return (result[0] as { count: number }).count;
  }
}

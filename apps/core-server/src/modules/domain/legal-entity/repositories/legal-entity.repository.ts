import { Injectable } from '@nestjs/common';
import {
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { and, asc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type LegalEntity, legalEntities, sites } from '@/db/schema';

@Injectable()
export class LegalEntityRepository extends PrimaryBaseRepository<typeof legalEntities> {
  constructor(database: PrimaryDatabaseService) {
    super(database, legalEntities);
  }

  // Returns legal entities as select options, excluding a node and its descendant subtree entirely in SQL
  async findForSelectOptions(query: SelectOptionsQueryDto, excludeId?: string): Promise<SelectQueryResult> {
    const conditions: SQL[] = [];

    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(sql`(${legalEntities.name} ilike ${term} or ${legalEntities.code} ilike ${term})`);
    }

    if (excludeId) {
      conditions.push(sql`${legalEntities.id} not in (
        with recursive subtree as (
          select id, parent_id from ${legalEntities} where id = ${excludeId}
          union all
          select child.id, child.parent_id
          from ${legalEntities} child
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

  // Finds all legal entities for an organization ordered by creation time
  async findByOrg(orgId: string): Promise<LegalEntity[]> {
    return this.model.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Finds a legal entity by organization and code
  async findByOrgAndCode(orgId: string, code: string): Promise<LegalEntity | undefined> {
    return this.model.findFirst({
      where: { organizationId: orgId, code },
    });
  }

  // Finds legal entities by ids scoped to an organization
  async findByIds(orgId: string, ids: string[]): Promise<LegalEntity[]> {
    if (ids.length === 0) return [];
    return this.db
      .select()
      .from(legalEntities)
      .where(and(eq(legalEntities.organizationId, orgId), inArray(legalEntities.id, ids)));
  }

  // Returns a parent's sibling legal entities, ordered
  async siblingsOrdered(orgId: string, parentId: string | null): Promise<LegalEntity[]> {
    return this.db
      .select()
      .from(legalEntities)
      .where(
        and(eq(legalEntities.organizationId, orgId), sql`${legalEntities.parentId} is not distinct from ${parentId}`),
      )
      .orderBy(asc(legalEntities.sortOrder), asc(legalEntities.name));
  }

  // Applies new sort orders to a batch of legal entities
  async setSortOrders(entries: { id: string; sortOrder: number }[]): Promise<void> {
    await Promise.all(
      entries.map((entry) =>
        this.db
          .update(legalEntities)
          .set({ sortOrder: entry.sortOrder, updatedAt: new Date() })
          .where(eq(legalEntities.id, entry.id)),
      ),
    );
  }

  // Returns the next sort order for a new sibling
  async nextSortOrder(orgId: string, parentId: string | null): Promise<number> {
    const result = await this.db
      .select({ max: sql<number>`coalesce(max(${legalEntities.sortOrder}), 0)::int` })
      .from(legalEntities)
      .where(
        and(eq(legalEntities.organizationId, orgId), sql`${legalEntities.parentId} is not distinct from ${parentId}`),
      );
    return (result[0]?.max ?? 0) + 1;
  }

  // Counts child legal entities of a parent legal entity
  async countChildren(parentId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(legalEntities)
      .where(eq(legalEntities.parentId, parentId));
    return (result[0] as { count: number }).count;
  }

  // Counts sites linked to a legal entity
  async countSitesByLegalEntity(legalEntityId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(sites)
      .where(eq(sites.legalEntityId, legalEntityId));
    return (result[0] as { count: number }).count;
  }
}

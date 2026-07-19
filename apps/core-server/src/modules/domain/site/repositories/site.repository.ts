import { Injectable } from '@nestjs/common';
import {
  PrimaryBaseRepository,
  PrimaryDatabaseService,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
} from '@vritti/api-sdk/database';
import { and, asc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import {
  type LegalEntity,
  type LeTaxRegistration,
  legalEntities,
  leTaxRegistrations,
  type Site,
  type SiteGroup,
  siteGroups,
  sites,
} from '@/db/schema';

@Injectable()
export class SiteDomainRepository extends PrimaryBaseRepository<typeof sites> {
  constructor(database: PrimaryDatabaseService) {
    super(database, sites);
  }

  // Finds all sites for an organization ordered by sort order
  async findByOrg(orgId: string): Promise<Site[]> {
    return this.model.findMany({
      where: { organizationId: orgId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Returns a legal entity's active sites as select options
  async findForSelectOptions(legalEntityId: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    const conditions: SQL[] = [];

    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(sql`(${sites.name} ilike ${term} or ${sites.code} ilike ${term})`);
    }

    return this.findForSelect({
      value: 'id',
      label: 'name',
      description: 'code',
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      where: { legalEntityId, isActive: true },
      orderBy: { sortOrder: 'asc', name: 'asc' },
      conditions,
    });
  }

  // Finds sites by ids scoped to an organization
  async findByIds(orgId: string, ids: string[]): Promise<Site[]> {
    if (ids.length === 0) return [];
    return this.db
      .select()
      .from(sites)
      .where(and(eq(sites.organizationId, orgId), inArray(sites.id, ids)));
  }

  // Applies new sort orders to a batch of sites
  async setSortOrders(entries: { id: string; sortOrder: number }[]): Promise<void> {
    await Promise.all(
      entries.map((entry) =>
        this.db.update(sites).set({ sortOrder: entry.sortOrder, updatedAt: new Date() }).where(eq(sites.id, entry.id)),
      ),
    );
  }

  // Returns a legal entity's sibling sites, ordered
  async siblingsOrdered(orgId: string, legalEntityId: string): Promise<Site[]> {
    return this.db
      .select()
      .from(sites)
      .where(and(eq(sites.organizationId, orgId), eq(sites.legalEntityId, legalEntityId)))
      .orderBy(asc(sites.sortOrder), asc(sites.name));
  }

  // Returns the next sort order for a new site
  async nextSortOrder(orgId: string, legalEntityId: string): Promise<number> {
    const result = await this.db
      .select({ max: sql<number>`coalesce(max(${sites.sortOrder}), 0)::int` })
      .from(sites)
      .where(and(eq(sites.organizationId, orgId), eq(sites.legalEntityId, legalEntityId)));
    return (result[0]?.max ?? 0) + 1;
  }

  // Finds a site by its organization-unique code for uniqueness checks
  async findByOrgAndCode(orgId: string, code: string): Promise<Site | undefined> {
    return this.model.findFirst({
      where: { organizationId: orgId, code },
    });
  }

  // Finds a site group by ID for membership validation
  async findSiteGroupById(id: string): Promise<SiteGroup | undefined> {
    const rows = await this.db.select().from(siteGroups).where(eq(siteGroups.id, id)).limit(1);
    return rows[0];
  }

  // Finds an organization's site groups as id/parentId pairs
  async findGroupParentPairs(orgId: string): Promise<{ id: string; parentId: string | null }[]> {
    return this.db
      .select({ id: siteGroups.id, parentId: siteGroups.parentId })
      .from(siteGroups)
      .where(eq(siteGroups.organizationId, orgId));
  }

  // Finds all site groups for an organization for session-structure resolution
  async findGroupsByOrg(orgId: string): Promise<SiteGroup[]> {
    return this.db.select().from(siteGroups).where(eq(siteGroups.organizationId, orgId));
  }

  // Finds all legal entities for an organization for session-structure resolution
  async findLegalEntitiesByOrg(orgId: string): Promise<LegalEntity[]> {
    return this.db.select().from(legalEntities).where(eq(legalEntities.organizationId, orgId));
  }

  // Resolves a site group's chain of ancestors
  async findGroupChainIds(groupId: string): Promise<string[]> {
    const chain: string[] = [];
    let cursor: string | null = groupId;
    let guard = 0;
    while (cursor && guard < 100) {
      chain.push(cursor);
      const rows: { parentId: string | null }[] = await this.db
        .select({ parentId: siteGroups.parentId })
        .from(siteGroups)
        .where(eq(siteGroups.id, cursor))
        .limit(1);
      cursor = rows[0]?.parentId ?? null;
      guard += 1;
    }
    return chain;
  }

  // Finds a legal entity by ID for link validation
  async findLegalEntityById(id: string): Promise<LegalEntity | undefined> {
    const rows = await this.db.select().from(legalEntities).where(eq(legalEntities.id, id)).limit(1);
    return rows[0];
  }

  // Finds a tax registration by ID for link validation
  async findTaxRegistrationById(id: string): Promise<LeTaxRegistration | undefined> {
    const rows = await this.db.select().from(leTaxRegistrations).where(eq(leTaxRegistrations.id, id)).limit(1);
    return rows[0];
  }

  // Resolves a site's currency from its owning legal entity
  async findLeCurrencyBySiteId(siteId: string): Promise<string | null> {
    const rows = await this.db
      .select({ currencyCode: legalEntities.currencyCode })
      .from(sites)
      .innerJoin(legalEntities, eq(legalEntities.id, sites.legalEntityId))
      .where(eq(sites.id, siteId))
      .limit(1);
    return rows[0]?.currencyCode ?? null;
  }

  // Resolves a site's workspace context
  async findWorkspaceContextById(
    siteId: string,
  ): Promise<{ timezone: string; legalEntityId: string; currencyCode: string } | undefined> {
    const rows = await this.db
      .select({
        timezone: sites.timezone,
        legalEntityId: sites.legalEntityId,
        currencyCode: legalEntities.currencyCode,
      })
      .from(sites)
      .innerJoin(legalEntities, eq(legalEntities.id, sites.legalEntityId))
      .where(eq(sites.id, siteId))
      .limit(1);
    return rows[0];
  }
}

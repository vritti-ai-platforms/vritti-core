import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { and, asc, eq, inArray, type SQL, sql } from '@vritti/api-sdk/drizzle-orm';
import { type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';
import {
  type LegalEntity,
  legalEntities,
  type Site,
  type SiteGroup,
  type SiteType,
  siteGroups,
  sites,
} from '@/db/schema';

export interface AppSiteRow {
  id: string;
  code: string;
  name: string;
  type: SiteType;
  timezone: string;
  legalEntityId: string;
  currencyCode: string;
  sortOrder: number;
}

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

  // The sites an organization can sell from, each carrying its legal entity's currency.
  async findForAppByOrg(orgId: string, types?: SiteType[]): Promise<AppSiteRow[]> {
    const conditions: SQL[] = [
      eq(sites.organizationId, orgId),
      eq(sites.isActive, true),
      eq(legalEntities.isActive, true),
    ];
    // Absent means every type.
    if (types?.length) conditions.push(inArray(sites.type, types));

    return (
      this.db
        .select({
          id: sites.id,
          code: sites.code,
          name: sites.name,
          type: sites.type,
          timezone: sites.timezone,
          legalEntityId: sites.legalEntityId,
          currencyCode: legalEntities.currencyCode,
          sortOrder: sites.sortOrder,
        })
        .from(sites)
        .innerJoin(legalEntities, eq(legalEntities.id, sites.legalEntityId))
        .where(and(...conditions))
        // Staff drag these into the order they want them shown; name breaks a tie.
        .orderBy(asc(sites.sortOrder), asc(sites.name))
    );
  }

  // An organization's active sites as select options, optionally narrowed to one legal entity.
  async findForOrgSelectOptions(
    orgId: string,
    query: SelectOptionsQueryDto & { legalEntityId?: string },
  ): Promise<SelectQueryResult> {
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
      where: {
        organizationId: orgId,
        isActive: true,
        ...(query.legalEntityId ? { legalEntityId: query.legalEntityId } : {}),
      },
      orderBy: { sortOrder: 'asc', name: 'asc' },
      additionalKeys: 'legalEntityId',
      conditions,
    });
  }

  // The site types this organization actually has, as select options.
  async findTypesForOrg(orgId: string): Promise<SiteType[]> {
    const rows = await this.db
      .selectDistinct({ type: sites.type })
      .from(sites)
      .where(and(eq(sites.organizationId, orgId), eq(sites.isActive, true)))
      .orderBy(asc(sites.type));
    return rows.map((row) => row.type);
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

  // Sites trading under a registration.
  async countByRegistration(registrationId: string): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(sites)
      .where(eq(sites.registrationId, registrationId));
    return rows[0]?.count ?? 0;
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

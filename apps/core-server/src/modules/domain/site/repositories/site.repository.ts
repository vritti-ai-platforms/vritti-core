import { Injectable } from '@nestjs/common';
import { PrimaryBaseRepository, PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { eq } from '@vritti/api-sdk/drizzle-orm';
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
export class SiteRepository extends PrimaryBaseRepository<typeof sites> {
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

  // Finds a site group by ID for membership validation
  async findSiteGroupById(id: string): Promise<SiteGroup | undefined> {
    const rows = await this.db.select().from(siteGroups).where(eq(siteGroups.id, id)).limit(1);
    return rows[0];
  }

  // Finds all site groups for an organization as id/parentId pairs for chain resolution
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

  // Resolves a site group's chain (the group itself followed by its ancestors, nearest first)
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
  // Resolves a site's currency from its owning legal entity in one query
  async findLeCurrencyBySiteId(siteId: string): Promise<string | null> {
    const rows = await this.db
      .select({ currencyCode: legalEntities.currencyCode })
      .from(sites)
      .innerJoin(legalEntities, eq(legalEntities.id, sites.legalEntityId))
      .where(eq(sites.id, siteId))
      .limit(1);
    return rows[0]?.currencyCode ?? null;
  }
}

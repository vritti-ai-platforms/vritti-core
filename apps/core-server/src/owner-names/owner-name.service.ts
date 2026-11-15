import { LegalEntityDomainRepository } from '@domain/legal-entity/repositories/legal-entity.repository';
import { OrganizationDomainRepository } from '@domain/organization/repositories/organization.repository';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { OwnerNameCacheService } from './owner-name-cache.service';

export interface OwnedRow {
  ownerScope: string;
  legalEntityId: string | null;
  siteId: string | null;
}

@Injectable()
export class OwnerNameService {
  constructor(
    private readonly organizationRepository: OrganizationDomainRepository,
    private readonly legalEntityRepository: LegalEntityDomainRepository,
    private readonly siteRepository: SiteDomainRepository,
    private readonly cache: OwnerNameCacheService,
  ) {}

  // Commerce stores only the owning ids; the names live in core, so they are resolved here.
  async resolve<T extends OwnedRow>(orgId: string, rows: T[]): Promise<(T & { ownerName: string })[]> {
    if (rows.length === 0) return [];

    const leIds = [...new Set(rows.filter((r) => r.ownerScope === 'LE').map((r) => r.legalEntityId as string))];
    const siteIds = [...new Set(rows.filter((r) => r.ownerScope === 'SITE').map((r) => r.siteId as string))];
    const orgIds = rows.some((r) => r.ownerScope === 'ORG') ? [orgId] : [];

    const [orgNames, leNames, siteNames] = await Promise.all([
      this.namesFor('org', orgIds, async () => {
        const organization = await this.organizationRepository.findById(orgId);
        return organization ? [organization] : [];
      }),
      this.namesFor('le', leIds, (missing) => this.legalEntityRepository.findByIds(orgId, missing)),
      this.namesFor('site', siteIds, (missing) => this.siteRepository.findByIds(orgId, missing)),
    ]);

    return rows.map((row) => ({
      ...row,
      ownerName:
        row.ownerScope === 'SITE'
          ? (siteNames.get(row.siteId as string) ?? 'Unknown outlet')
          : row.ownerScope === 'LE'
            ? (leNames.get(row.legalEntityId as string) ?? 'Unknown company')
            : (orgNames.get(orgId) ?? 'Organization'),
    }));
  }

  // Fills each row's site name and code; every row belongs to a site, and one that no longer exists is an error
  async withSiteNames<T extends { siteId: string }>(
    orgId: string,
    rows: T[],
  ): Promise<(T & { siteName: string; siteCode: string })[]> {
    const sites = await this.siteNamesAndCodes(orgId, [...new Set(rows.map((row) => row.siteId))]);
    return rows.map((row) => {
      const site = sites.get(row.siteId);
      if (!site) throw new NotFoundException(`Site ${row.siteId} was not found.`);
      return { ...row, siteName: site.name, siteCode: site.code };
    });
  }

  // Fills the site name and code of the rows that belong to a site; a row with no site is the legal entity's own and
  // stays unnamed
  async withOptionalSiteNames<T extends { siteId: string | null }>(
    orgId: string,
    rows: T[],
  ): Promise<(T & { siteName: string | null; siteCode: string | null })[]> {
    const siteIds = [...new Set(rows.flatMap((row) => (row.siteId ? [row.siteId] : [])))];
    const sites = await this.siteNamesAndCodes(orgId, siteIds);
    return rows.map((row) => {
      if (!row.siteId) return { ...row, siteName: null, siteCode: null };
      const site = sites.get(row.siteId);
      if (!site) throw new NotFoundException(`Site ${row.siteId} was not found.`);
      return { ...row, siteName: site.name, siteCode: site.code };
    });
  }

  // Names every site of a row by its id fields (e.g. a transfer's from and to sites); a site that no longer exists is an
  // error
  async requireSiteNames(orgId: string, siteIds: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(siteIds)];
    const sites = await this.siteNamesAndCodes(orgId, unique);
    const missing = unique.find((siteId) => !sites.has(siteId));
    if (missing) throw new NotFoundException(`Site ${missing} was not found.`);
    return new Map([...sites].map(([siteId, site]) => [siteId, site.name]));
  }

  // Reads the names and codes of the given sites from the cache, fetching and caching whatever it lacks; a site that no
  // longer exists is left out, so callers decide whether that is an error
  private async siteNamesAndCodes(
    orgId: string,
    siteIds: string[],
  ): Promise<Map<string, { name: string; code: string }>> {
    if (siteIds.length === 0) return new Map();
    const [names, codes] = await Promise.all([
      this.cache.getMany('site', siteIds),
      this.cache.getMany('siteCode', siteIds),
    ]);
    const missing = [...new Set([...names.missing, ...codes.missing])];
    if (missing.length > 0) {
      const sites = await this.siteRepository.findByIds(orgId, missing);
      await Promise.all([
        this.cache.setMany(
          'site',
          sites.map((site) => ({ id: site.id, name: site.name })),
        ),
        this.cache.setMany(
          'siteCode',
          sites.map((site) => ({ id: site.id, name: site.code })),
        ),
      ]);
      for (const site of sites) {
        names.names.set(site.id, site.name);
        codes.names.set(site.id, site.code);
      }
    }
    const sites = new Map<string, { name: string; code: string }>();
    for (const siteId of siteIds) {
      const name = names.names.get(siteId);
      const code = codes.names.get(siteId);
      if (name !== undefined && code !== undefined) sites.set(siteId, { name, code });
    }
    return sites;
  }

  // Serves what the cache holds and reads only the rest, caching whatever it had to fetch
  private async namesFor(
    kind: 'org' | 'le' | 'site',
    ids: string[],
    fetch: (missing: string[]) => Promise<{ id: string; name: string }[]>,
  ): Promise<Map<string, string>> {
    if (ids.length === 0) return new Map();

    const { names, missing } = await this.cache.getMany(kind, ids);
    if (missing.length === 0) return names;

    const rows = await fetch(missing);
    await this.cache.setMany(kind, rows);
    for (const row of rows) names.set(row.id, row.name);
    return names;
  }
}

import { LegalEntityDomainRepository } from '@domain/legal-entity/repositories/legal-entity.repository';
import { OrganizationDomainRepository } from '@domain/organization/repositories/organization.repository';
import { SiteDomainRepository } from '@domain/site/repositories/site.repository';
import { Injectable } from '@nestjs/common';
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

  // Commerce stores only the owning ids; the names live in core, so they are resolved here. Read
  // through the cache and batched by scope, so a warm grid costs no database round trip at all and a
  // cold one costs at most three — never one per row.
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

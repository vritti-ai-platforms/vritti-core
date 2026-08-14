import { Injectable } from '@nestjs/common';
import type { SelectOptionsQueryDto, SelectQueryOption, SelectQueryResult } from '@vritti/api-sdk/database';
import { ServiceTypeValues } from '@/db/schema';
import { OrganizationDomainService } from '../../../domain/organization/services/organization.service';
import { OrganizationGatewayService } from '../../organization/services/organization-gateway.service';
import type { GiteaApiRepository } from '../../repositories/dto/response/repository-response.dto';
import { GiteaHttpService } from '../../services/gitea-http.service';
import type { PackageTagsSelectQueryDto } from '../dto/request/package-tags-select-query.dto';
import type { GiteaApiPackage } from '../dto/response/gitea-package.dto';

const DEFAULT_LIMIT = 20;

// Website container images live in Gitea's container registry; every other package type is ignored
const CONTAINER_PACKAGE_TYPE = 'container';

// Gitea's repo search answers with an envelope, unlike /orgs/{ns}/repos which answers with a bare array
interface GiteaApiRepoSearch {
  ok: boolean;
  data: GiteaApiRepository[];
}

@Injectable()
export class SelectApiGatewayService {
  constructor(
    private readonly gitea: GiteaHttpService,
    private readonly organizationGatewayService: OrganizationGatewayService,
    private readonly organizationService: OrganizationDomainService,
  ) {}

  // Returns repository options for select dropdowns, keyed by name — repositories are addressed by name
  // everywhere in this API, so the name is both the value and the label
  async selectRepositories(subdomain: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    const namespace = await this.organizationGatewayService.requireNamespace(subdomain);

    // Resolving the current selection: the name IS the label, so this needs no call to the git service
    if (query.values) {
      const names = query.values.split(',').filter(Boolean);
      return { options: names.map((name) => ({ value: name, label: name })), hasMore: false };
    }

    const limit = query.limit ?? DEFAULT_LIMIT;
    const page = Math.floor((query.offset ?? 0) / limit) + 1;
    const repositories = await this.searchRepositories(subdomain, namespace, query.search, page, limit);

    const excluded = new Set((query.excludeIds ?? '').split(',').filter(Boolean));
    const options: SelectQueryOption[] = repositories
      .filter((repository) => !excluded.has(repository.name))
      .map((repository) => ({
        value: repository.name,
        label: repository.name,
        ...(repository.description ? { description: repository.description } : {}),
      }));

    // Gitea reports no total on this route, so a full page is treated as "there may be another"
    return { options, hasMore: repositories.length === limit };
  }

  // Returns distinct container-package options for select dropdowns. Gitea lists one entry per package
  // version, so the raw page is collapsed to distinct names — the name is both value and label.
  async selectPackages(subdomain: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    const namespace = await this.organizationGatewayService.requireNamespace(subdomain);

    // Resolving the current selection: the name IS the label, so no call to the git service is needed
    if (query.values) {
      const names = query.values.split(',').filter(Boolean);
      return { options: names.map((name) => ({ value: name, label: name })), hasMore: false };
    }

    const limit = query.limit ?? DEFAULT_LIMIT;
    const page = Math.floor((query.offset ?? 0) / limit) + 1;
    const packages = await this.searchPackages(namespace, query.search, page, limit);

    const excluded = new Set((query.excludeIds ?? '').split(',').filter(Boolean));
    const seen = new Set<string>();
    const options: SelectQueryOption[] = [];
    for (const entry of packages) {
      if (excluded.has(entry.name) || seen.has(entry.name)) continue;
      seen.add(entry.name);
      options.push({ value: entry.name, label: entry.name });
    }

    // Gitea reports no usable total here, so a full raw page is treated as "there may be another".
    // Distinct names can be fewer than the page size when a package has many versions.
    return { options, hasMore: packages.length === limit };
  }

  // Returns tag (version) options for one container package, newest first — the version is both value
  // and label. Backs the website-creation package selector.
  async selectPackageTags(subdomain: string, query: PackageTagsSelectQueryDto): Promise<SelectQueryResult> {
    const namespace = await this.organizationGatewayService.requireNamespace(subdomain);

    // Resolving the current selection: the version IS the label, so no call to the git service is needed
    if (query.values) {
      const tags = query.values.split(',').filter(Boolean);
      return { options: tags.map((tag) => ({ value: tag, label: tag })), hasMore: false };
    }

    const limit = query.limit ?? DEFAULT_LIMIT;
    const page = Math.floor((query.offset ?? 0) / limit) + 1;
    const versions = await this.listPackageVersions(namespace, query.package, page, limit);

    // Gitea's `q` matches package names by substring, so entries for a package whose name merely
    // contains this one are dropped here. Versions are then ordered newest-first.
    const exact = versions
      .filter((entry) => entry.name === query.package)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

    const excluded = new Set((query.excludeIds ?? '').split(',').filter(Boolean));
    const searchTerm = query.search?.toLowerCase();
    const seen = new Set<string>();
    const options: SelectQueryOption[] = [];
    for (const entry of exact) {
      if (excluded.has(entry.version) || seen.has(entry.version)) continue;
      // The version filter is applied here because Gitea's `q` targets the package name, not the tag
      if (searchTerm && !entry.version.toLowerCase().includes(searchTerm)) continue;
      seen.add(entry.version);
      options.push({ value: entry.version, label: entry.version });
    }

    return { options, hasMore: versions.length === limit };
  }

  // Returns combined image options (`name:tag`) for select dropdowns — one option per container-package
  // VERSION, since a website pins a single name+version. Gitea lists one entry per version already, so no
  // collapsing: each entry becomes an option whose value and label are `${name}:${version}`. Callers split
  // on the last ':' back into image + tag. Backs the website-creation image selector (replaces the
  // package→tag cascade), so it takes no package param.
  async selectImages(subdomain: string, query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    const namespace = await this.organizationGatewayService.requireNamespace(subdomain);

    // Resolving the current selection: the `name:tag` ref IS the label, so no call to the git service is needed
    if (query.values) {
      const refs = query.values.split(',').filter(Boolean);
      return { options: refs.map((ref) => ({ value: ref, label: ref })), hasMore: false };
    }

    const limit = query.limit ?? DEFAULT_LIMIT;
    const page = Math.floor((query.offset ?? 0) / limit) + 1;
    const packages = await this.searchPackages(namespace, query.search, page, limit);

    const excluded = new Set((query.excludeIds ?? '').split(',').filter(Boolean));
    // Gitea's `q` matches the package NAME; also let the search term match the tag half of the combined ref
    const searchTerm = query.search?.toLowerCase();
    const seen = new Set<string>();
    const options: SelectQueryOption[] = [];
    for (const entry of packages) {
      const ref = `${entry.name}:${entry.version}`;
      if (excluded.has(ref) || seen.has(ref)) continue;
      if (searchTerm && !ref.toLowerCase().includes(searchTerm)) continue;
      seen.add(ref);
      options.push({ value: ref, label: ref });
    }

    // Gitea reports no usable total here, so a full raw page is treated as "there may be another".
    return { options, hasMore: packages.length === limit };
  }

  // Searches within the organization's repositories. The search route needs the org's numeric git id,
  // which only the provisioned service row carries; without it fall back to the unfiltered listing.
  private async searchRepositories(
    subdomain: string,
    namespace: string,
    search: string | undefined,
    page: number,
    limit: number,
  ): Promise<GiteaApiRepository[]> {
    const externalId = await this.giteaOrgId(subdomain);

    if (externalId) {
      const response = await this.gitea.getOrNull<GiteaApiRepoSearch>('/repos/search', {
        params: { uid: externalId, ...(search ? { q: search } : {}), page, limit },
      });
      return response?.data ?? [];
    }

    const repositories = await this.gitea.getOrNull<GiteaApiRepository[]>(`/orgs/${namespace}/repos`, {
      params: { page, limit },
    });
    return repositories ?? [];
  }

  // Lists the namespace's container packages. Gitea's `q` filters by package name (substring), and the
  // registry returns one entry per version, so callers must collapse by name.
  private async searchPackages(
    namespace: string,
    search: string | undefined,
    page: number,
    limit: number,
  ): Promise<GiteaApiPackage[]> {
    const packages = await this.gitea.getOrNull<GiteaApiPackage[]>(`/packages/${namespace}`, {
      params: { type: CONTAINER_PACKAGE_TYPE, ...(search ? { q: search } : {}), page, limit },
    });
    return packages ?? [];
  }

  // Lists version entries for a single container package. There is no list-versions route on Gitea, so
  // this reuses the packages listing pinned to the package name via `q`; the caller exact-matches the name.
  private async listPackageVersions(
    namespace: string,
    packageName: string,
    page: number,
    limit: number,
  ): Promise<GiteaApiPackage[]> {
    const versions = await this.gitea.getOrNull<GiteaApiPackage[]>(`/packages/${namespace}`, {
      params: { type: CONTAINER_PACKAGE_TYPE, q: packageName, page, limit },
    });
    return versions ?? [];
  }

  // The organization's numeric id in the git service, recorded when the namespace was provisioned
  private async giteaOrgId(subdomain: string): Promise<number | null> {
    const org = await this.organizationService.getBySubdomain(subdomain);
    const gitea = org?.services.find((entry) => entry.service === ServiceTypeValues.GITEA);
    const parsed = Number(gitea?.externalId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
}

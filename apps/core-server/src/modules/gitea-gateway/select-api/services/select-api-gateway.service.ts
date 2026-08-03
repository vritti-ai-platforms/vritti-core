import { Injectable } from '@nestjs/common';
import type { SelectOptionsQueryDto, SelectQueryOption, SelectQueryResult } from '@vritti/api-sdk/database';
import { ServiceTypeValues } from '@/db/schema';
import { OrganizationDomainService } from '../../../domain/organization/services/organization.service';
import { OrganizationGatewayService } from '../../organization/services/organization-gateway.service';
import type { GiteaApiRepository } from '../../repositories/dto/response/repository-response.dto';
import { GiteaHttpService } from '../../services/gitea-http.service';

const DEFAULT_LIMIT = 20;

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

  // The organization's numeric id in the git service, recorded when the namespace was provisioned
  private async giteaOrgId(subdomain: string): Promise<number | null> {
    const org = await this.organizationService.getBySubdomain(subdomain);
    const gitea = org?.services.find((entry) => entry.service === ServiceTypeValues.GITEA);
    const parsed = Number(gitea?.externalId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
}

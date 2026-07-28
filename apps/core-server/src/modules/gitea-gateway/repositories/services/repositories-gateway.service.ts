import { Injectable, Logger } from '@nestjs/common';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/database';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import { OrganizationGatewayService } from '../../organization/services/organization-gateway.service';
import { GiteaHttpService } from '../../services/gitea-http.service';
import type { CreateRepositoryDto } from '../dto/request/create-repository.dto';
import type { ListRepositoriesQueryDto } from '../dto/request/list-repositories-query.dto';
import type { RepositoryContentsQueryDto } from '../dto/request/repository-contents-query.dto';
import { BranchListResponseDto, type GiteaApiBranch } from '../dto/response/branch-list-response.dto';
import {
  type GiteaApiContentsExt,
  RepositoryContentsResponseDto,
} from '../dto/response/repository-contents-response.dto';
import { RepositoryListResponseDto } from '../dto/response/repository-list-response.dto';
import { type GiteaApiRepository, RepositoryResponseDto } from '../dto/response/repository-response.dto';
import { RepositoryStatsResponseDto } from '../dto/response/repository-stats-response.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

// Counting only needs the x-total-count header, so ask for the smallest possible page
const COUNT_LIMIT = 1;

// A single page is enough for a branch picker — 50 is also Gitea's own MAX_RESPONSE_ITEMS ceiling
const BRANCH_LIMIT = 50;

// Last-commit fields cost an extra tree walk in Gitea, so they are requested explicitly — they feed the
// listing's Last-commit column. lfs_metadata surfaces lfs_size, without which an LFS-tracked row would
// report its ~130-byte pointer as the file size. File content is not requested: nothing renders it.
const CONTENTS_INCLUDES = 'commit_metadata,commit_message,lfs_metadata';

// Percent-encodes each segment of a repository-relative path, keeping the separators intact.
// Repository names and paths arrive as route params and query strings, and an unescaped `..` would
// let the request climb out of the repository to another endpoint under the site-admin token.
function encodeRepoPath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

@Injectable()
export class RepositoriesGatewayService {
  private readonly logger = new Logger(RepositoriesGatewayService.name);

  constructor(
    private readonly gitea: GiteaHttpService,
    private readonly organizationGatewayService: OrganizationGatewayService,
  ) {}

  // Returns a page of repositories in the organization's git namespace
  async findAll(subdomain: string, query: ListRepositoriesQueryDto): Promise<RepositoryListResponseDto> {
    const namespace = await this.organizationGatewayService.requireNamespace(subdomain);
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const response = await this.gitea.getWithHeaders<GiteaApiRepository[]>(`/orgs/${namespace}/repos`, {
      params: { page, limit },
    });

    const total = Number(response.headers['x-total-count']);

    return RepositoryListResponseDto.from(
      response.data.map(RepositoryResponseDto.from),
      Number.isFinite(total) ? total : response.data.length,
    );
  }

  // Returns a single repository in the organization's git namespace
  async findOne(subdomain: string, name: string): Promise<RepositoryResponseDto> {
    const namespace = await this.organizationGatewayService.requireNamespace(subdomain);

    const repository = await this.gitea.get<GiteaApiRepository>(`/repos/${namespace}/${encodeURIComponent(name)}`);

    return RepositoryResponseDto.from(repository);
  }

  // Reads a collection's total from its x-total-count header without fetching the collection.
  // Resolves to 0 rather than throwing when Gitea reports the collection does not exist — /commits
  // 404s on a repository with no commits, which is a legitimate zero rather than an error.
  private async countOf(path: string, params?: Record<string, unknown>): Promise<number> {
    try {
      const response = await this.gitea.getWithHeaders<unknown[]>(path, {
        params: { limit: COUNT_LIMIT, ...params },
      });
      const total = Number(response.headers['x-total-count']);
      return Number.isFinite(total) ? total : 0;
    } catch (error) {
      if (error instanceof NotFoundException) return 0;
      throw error;
    }
  }

  // Returns the commit, branch and tag counts for the repository's stats bar
  async getStats(subdomain: string, name: string, ref?: string): Promise<RepositoryStatsResponseDto> {
    const namespace = await this.organizationGatewayService.requireNamespace(subdomain);
    const base = `/repos/${namespace}/${encodeURIComponent(name)}`;

    const [commits, branches, tags] = await Promise.all([
      // Scoped to the selected ref, matching what the branch picker is showing. stat=false skips diff
      // computation Gitea would otherwise do for a payload we discard anyway.
      this.countOf(`${base}/commits`, { stat: false, ...(ref ? { sha: ref } : {}) }),
      this.countOf(`${base}/branches`),
      this.countOf(`${base}/tags`),
    ]);

    return RepositoryStatsResponseDto.from(commits, branches, tags);
  }

  // Returns the branch names in the repository, for the Code tab's branch picker
  async listBranches(subdomain: string, name: string): Promise<BranchListResponseDto> {
    const namespace = await this.organizationGatewayService.requireNamespace(subdomain);

    const branches = await this.gitea.getOrNull<GiteaApiBranch[]>(
      `/repos/${namespace}/${encodeURIComponent(name)}/branches`,
      { params: { limit: BRANCH_LIMIT } },
    );

    return BranchListResponseDto.from(branches);
  }

  // Returns the directory listing at a path inside the repository
  async getContents(
    subdomain: string,
    name: string,
    query: RepositoryContentsQueryDto,
  ): Promise<RepositoryContentsResponseDto> {
    const namespace = await this.organizationGatewayService.requireNamespace(subdomain);
    const path = query.path ? encodeRepoPath(query.path) : '';

    // Gitea defaults `ref` to the repository's default branch, so it is only sent when overridden
    const contents = await this.gitea.getOrNull<GiteaApiContentsExt>(
      `/repos/${namespace}/${encodeURIComponent(name)}/contents-ext/${path}`,
      { params: { includes: CONTENTS_INCLUDES, ...(query.ref ? { ref: query.ref } : {}) } },
    );

    // Three cases collapse to an empty listing rather than an error: a repository with no commits, a
    // path that no longer exists on this ref (both 404), and a path resolving to a file — Gitea then
    // answers with file_contents and no dir_contents, which this gateway deliberately ignores.
    return RepositoryContentsResponseDto.from(contents?.dir_contents ?? []);
  }

  // Creates a repository inside the organization's git namespace
  async create(subdomain: string, dto: CreateRepositoryDto): Promise<CreateResponseDto<RepositoryResponseDto>> {
    const namespace = await this.organizationGatewayService.requireNamespace(subdomain);

    const repository = await this.gitea.post<GiteaApiRepository>(`/orgs/${namespace}/repos`, {
      name: dto.name,
      description: dto.description ?? '',
      private: dto.isPrivate ?? true,
      default_branch: 'main',
    });

    this.logger.log(`Created git repository ${namespace}/${dto.name}`);

    return {
      success: true,
      message: `Repository "${repository.name}" created successfully.`,
      data: RepositoryResponseDto.from(repository),
    };
  }

  // Deletes a repository owned by the organization's git namespace
  async remove(subdomain: string, name: string): Promise<SuccessResponseDto> {
    // Used directly rather than via requireNamespace: a 404 from Gitea is the correct answer when
    // the namespace does not exist, and it also enforces cross-org isolation.
    await this.gitea.delete<void>(`/repos/${subdomain}/${encodeURIComponent(name)}`);

    this.logger.log(`Deleted git repository ${subdomain}/${name}`);
    return { success: true, message: `Repository "${name}" deleted successfully.` };
  }
}

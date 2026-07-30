import { axios } from '@vritti/quantum-ui/axios';
import type { CreateResponse, SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type {
  BranchListResponse,
  CreateRepositoryData,
  RepositoriesTableResponse,
  RepositoryContentsData,
  RepositoryContentsParams,
  RepositoryData,
  RepositoryStatsData,
} from '@/schemas/repositories';

// Fetches the repositories table — the server reads the pushed table state and applies pagination itself
export function getRepositoriesTable(): Promise<RepositoriesTableResponse> {
  return axios.get<RepositoriesTableResponse>('gitea-api/repositories/table').then((r) => r.data);
}

// Fetches a single repository by name
export function getRepository(name: string): Promise<RepositoryData> {
  return axios.get<RepositoryData>(`gitea-api/repositories/${name}`).then((r) => r.data);
}

// Fetches the commit, branch and tag counts for a repository
export function getRepositoryStats(name: string, ref?: string): Promise<RepositoryStatsData> {
  return axios
    .get<RepositoryStatsData>(`gitea-api/repositories/${name}/stats`, { params: ref ? { ref } : undefined })
    .then((r) => r.data);
}

// Fetches the branch names in a repository
export function listBranches(name: string): Promise<BranchListResponse> {
  return axios.get<BranchListResponse>(`gitea-api/repositories/${name}/branches`).then((r) => r.data);
}

// Fetches a directory listing or a single file at a path inside the repository
export function getRepositoryContents(name: string, params: RepositoryContentsParams): Promise<RepositoryContentsData> {
  return axios.get<RepositoryContentsData>(`gitea-api/repositories/${name}/contents`, { params }).then((r) => r.data);
}

// Creates a repository in the org's git namespace
export function createRepository(data: CreateRepositoryData): Promise<CreateResponse<RepositoryData>> {
  return axios.post<CreateResponse<RepositoryData>>('gitea-api/repositories', data).then((r) => r.data);
}

// Permanently deletes a repository from the org's git namespace
export function deleteRepository(name: string): Promise<SuccessResponse> {
  return axios.delete<SuccessResponse>(`gitea-api/repositories/${name}`).then((r) => r.data);
}

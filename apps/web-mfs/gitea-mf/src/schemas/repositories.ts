import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

// A Gitea repository name is not a Vritti entity code — dots and underscores are allowed, so
// zodCodeField() does not apply. Mirrors CreateRepositoryDto on the gateway.
export const createRepositorySchema = z.object({
  name: z
    .string()
    .min(1, 'Repository name is required')
    .max(100, 'Repository name must be at most 100 characters')
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Letters, numbers, dots, underscores, and hyphens only'),
  description: z.string().max(255, 'Description must be at most 255 characters').optional(),
  isPrivate: z.boolean(),
});

export type CreateRepositoryFormData = z.infer<typeof createRepositorySchema>;

export interface CreateRepositoryData {
  name: string;
  description?: string;
  isPrivate?: boolean;
}

export interface RepositoryData {
  id: number;
  name: string;
  fullName: string;
  // Null when the repository has no description — never coerced to '' on the wire
  description: string | null;
  isPrivate: boolean;
  isEmpty: boolean;
  size: number;
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
}

// The table endpoint answers with the rows plus the table state the server applied, so pagination
// never has to be mirrored on this side
export type RepositoriesTableResponse = TableResponse<RepositoryData>;

export type RepositoryEntryType = 'file' | 'dir' | 'symlink' | 'submodule';

export interface RepositoryEntryData {
  name: string;
  path: string;
  entryType: RepositoryEntryType;
  size: number;
  lastCommitMessage: string | null;
  lastCommitSha: string | null;
}

// Directory listings only — file contents are not served
export interface RepositoryContentsData {
  entries: RepositoryEntryData[];
}

// Branch names only — the gateway drops Gitea's protection flags and commit payload
export interface BranchListResponse {
  items: string[];
}

// Counts for the Code tab's stats bar; commits is scoped to the requested ref
export interface RepositoryStatsData {
  commits: number;
  branches: number;
  tags: number;
}

export interface RepositoryContentsParams {
  // Repository-relative; empty means the repository root
  path: string;
  ref?: string;
}

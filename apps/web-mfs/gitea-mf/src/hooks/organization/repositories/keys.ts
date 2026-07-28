export const GITEA_REPOSITORIES_KEY = ['gitea', 'repositories'] as const;

export const GITEA_REPOSITORY_KEY = (name: string) => [...GITEA_REPOSITORIES_KEY, name] as const;

export const GITEA_REPOSITORY_BRANCHES_KEY = (name: string) => [...GITEA_REPOSITORY_KEY(name), 'branches'] as const;

export const GITEA_REPOSITORY_STATS_KEY = (name: string, ref?: string) =>
  [...GITEA_REPOSITORY_KEY(name), 'stats', ref ?? ''] as const;

export const GITEA_REPOSITORY_CONTENTS_KEY = (name: string, path: string, ref?: string) =>
  [...GITEA_REPOSITORY_KEY(name), 'contents', path, ref ?? ''] as const;

import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { RepositoryData } from '@/schemas/repositories';
import { getRepository } from '@/services/organization/repositories.service';
import { GITEA_REPOSITORY_KEY } from './keys';

// Fetches a repository by name; suspends until data is available. Not self-gated on the view permission —
// useSuspenseQuery has no `enabled`. The guarded GET is instead kept off the wire by the PermissionGate on
// the `:repoName` route, which never mounts a caller for a user without the view permission.
export function useRepository(name: string) {
  return useSuspenseQuery<RepositoryData, AxiosError>({
    queryKey: GITEA_REPOSITORY_KEY(name),
    queryFn: () => getRepository(name),
    // isEmpty flips on the first push. Under the host's 5-minute default the Code tab would keep
    // insisting "Nothing pushed yet" for a repository that already has commits.
    staleTime: 0,
  });
}

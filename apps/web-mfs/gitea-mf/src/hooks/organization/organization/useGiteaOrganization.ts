import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { OrganizationStatusResponse } from '@/schemas/organization';
import { getOrganizationStatus } from '@/services/organization/organization.service';
import { GITEA_ORGANIZATION_KEY } from './keys';

// Fetches the git organization's provisioning status; suspends until data is available, so the page's
// skeleton is its only loading state. Not self-gated on the view permission — useSuspenseQuery has no
// `enabled`. The guarded GET is instead kept off the wire by the PermissionGate on the route, which never
// mounts a caller for a user without the view permission.
export function useGiteaOrganization() {
  return useSuspenseQuery<OrganizationStatusResponse, AxiosError>({
    queryKey: [...GITEA_ORGANIZATION_KEY],
    queryFn: getOrganizationStatus,
  });
}

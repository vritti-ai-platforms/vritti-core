import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_ORGANISATION } from '@vritti/commerce-permissions/organisation';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { OrganisationStatusResponse } from '@/schemas/organisation';
import { getOrganisationStatus } from '@/services/organization/organisation.service';
import { GITEA_ORGANISATION_KEY } from './keys';

export function useGiteaOrganisation(
  options?: Omit<UseQueryOptions<OrganisationStatusResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_ORGANISATION.view);

  return useQuery<OrganisationStatusResponse, AxiosError>({
    queryKey: [...GITEA_ORGANISATION_KEY],
    queryFn: getOrganisationStatus,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}

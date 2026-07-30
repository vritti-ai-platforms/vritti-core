import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ORG_ORGANIZATION } from '@vritti/commerce-permissions/organization';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { OrganizationStatusResponse } from '@/schemas/organization';
import { getOrganizationStatus } from '@/services/organization/organization.service';
import { GITEA_ORGANIZATION_KEY } from './keys';

export function useGiteaOrganization(
  options?: Omit<UseQueryOptions<OrganizationStatusResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  const { available } = usePermission(ORG_ORGANIZATION.view);

  return useQuery<OrganizationStatusResponse, AxiosError>({
    queryKey: [...GITEA_ORGANIZATION_KEY],
    queryFn: getOrganizationStatus,
    ...options,
    enabled: available && (options?.enabled ?? true),
  });
}

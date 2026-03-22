import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
  type AssignedBU,
  type PermissionsResponse,
  getAssignedBusinessUnits,
  getPermissions,
} from '@services/permissions.service';

type UseBUsOptions = Omit<UseQueryOptions<AssignedBU[], AxiosError>, 'queryKey' | 'queryFn'>;

// Fetches the user's assigned business units
export function useAssignedBusinessUnits(options?: UseBUsOptions) {
  return useQuery<AssignedBU[], AxiosError>({
    queryKey: ['user-permissions', 'business-units'],
    queryFn: getAssignedBusinessUnits,
    ...options,
  });
}

type UsePermissionsOptions = Omit<UseQueryOptions<PermissionsResponse, AxiosError>, 'queryKey' | 'queryFn'>;

// Fetches resolved permissions for the user at a specific BU
export function useUserPermissions(buId: string | null, options?: UsePermissionsOptions) {
  return useQuery<PermissionsResponse, AxiosError>({
    queryKey: ['user-permissions', buId],
    queryFn: () => getPermissions(buId!),
    enabled: !!buId,
    ...options,
  });
}

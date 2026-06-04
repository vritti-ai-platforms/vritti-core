import {
  type AssignedBU,
  getAssignedBusinessUnits,
  getPermissions,
  type PermissionsResponse,
} from '@services/permissions.service';
import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

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
    queryFn: () => {
      if (!buId) throw new Error('buId is required');
      return getPermissions(buId);
    },
    enabled: !!buId,
    ...options,
  });
}

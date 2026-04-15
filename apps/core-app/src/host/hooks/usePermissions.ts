import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import {
  type AssignedBU,
  type PermissionsResponse,
  getAssignedBusinessUnits,
  getPermissions,
} from '../services/permissions.service';

/** Fetch business units the user has access to */
export function useAssignedBusinessUnits() {
  return useQuery<AssignedBU[], AxiosError>({
    queryKey: ['user-permissions', 'business-units'],
    queryFn: getAssignedBusinessUnits,
  });
}

/** Fetch resolved features for a specific BU (disabled until buId is set) */
export function useUserPermissions(buId: string | null) {
  return useQuery<PermissionsResponse, AxiosError>({
    queryKey: ['user-permissions', buId],
    queryFn: () => getPermissions(buId!),
    enabled: !!buId,
  });
}

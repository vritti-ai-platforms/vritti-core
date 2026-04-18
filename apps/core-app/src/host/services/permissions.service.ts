import { axios } from '@vritti/quantum-ui-native/utils';

// ---------------------------------------------------------------------------
// Types — mirrors web's permissions.service.ts
// ---------------------------------------------------------------------------

export interface AssignedBU {
  id: string;
  name: string;
  code: string | null;
  type: string;
}

export interface PermissionFeature {
  code: string;
  name: string;
  icon: string | null;
  permissions: string[];
  route: {
    remoteEntry: string;
    exposedModule: string;
    routePrefix: string;
  };
}

export interface PermissionsResponse {
  features: PermissionFeature[];
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/** Fetch business units assigned to the authenticated user */
export function getAssignedBusinessUnits(): Promise<AssignedBU[]> {
  return axios
    .get<AssignedBU[]>('user-permissions/business-units')
    .then((r) => r.data);
}

/** Fetch resolved permission features for a specific business unit */
export function getPermissions(buId: string): Promise<PermissionsResponse> {
  return axios
    .get<PermissionsResponse>('user-permissions', { params: { buId } })
    .then((r) => r.data);
}

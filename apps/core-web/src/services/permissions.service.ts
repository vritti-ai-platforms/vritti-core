import axios from '@vritti/quantum-ui/axios';

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

export interface AssignedBU {
  id: string;
  name: string;
  code: string | null;
  type: string;
}

// Fetches business units where the user has role assignments
export function getAssignedBusinessUnits(): Promise<AssignedBU[]> {
  return axios
    .get<AssignedBU[]>('user-permissions/business-units')
    .then((r: { data: AssignedBU[] }) => r.data);
}

// Fetches resolved features + MF config for the user at a specific BU
export function getPermissions(buId: string): Promise<PermissionsResponse> {
  return axios
    .get<PermissionsResponse>('user-permissions', { params: { buId } })
    .then((r: { data: PermissionsResponse }) => r.data);
}

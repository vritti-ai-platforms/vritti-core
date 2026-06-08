// Shared permission types. BUs + features are delivered via the SSE /auth/status stream
// (see AuthProvider), not via dedicated REST endpoints.

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
  appCode: string;
  appName: string;
  appIcon: string | null;
  appSortOrder: number;
}

export interface PermissionsResponse {
  features: PermissionFeature[];
}

export interface AssignedBU {
  id: string;
  name: string;
  code: string | null;
  type: string;
  timezone: string;
  currencyCode: string;
}

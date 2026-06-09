export interface AssignedBU {
  id: string;
  name: string;
  code: string | null;
  type: string;
  // Sent by the server (auth-status SSE) — drive BU-scoped date/currency formatting.
  timezone: string;
  currencyCode: string;
}

export interface PermissionFeature {
  code: string;
  name: string;
  icon: string | null;
  sfSymbol: string;
  materialSymbol: string;
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

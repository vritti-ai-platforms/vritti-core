export interface AssignedBU {
  id: string;
  name: string;
  code: string | null;
  type: string;
  // Sent by the server (auth-status SSE) — drive BU-scoped date/currency formatting.
  timezone: string;
  currencyCode: string;
}

export type LockReason = 'PLAN' | 'BU';

// Mirrors @vritti/api-sdk/catalog-resolver LockedPermission (RN cannot depend on the server SDK)
export interface LockedPermission {
  code: string;
  reason: LockReason | null;
  unlockPlans: string[];
}

// Mirrors @vritti/api-sdk/catalog-resolver PermissionFeature (RN cannot depend on the server SDK)
export interface PermissionFeature {
  code: string;
  name: string;
  lucideIcon: string | null;
  sfSymbol: string;
  materialSymbol: string;
  permissions: string[];
  // Lock overlay: feature-level lock + reason + the plans that would unlock it (upsell), plus per-permission locks
  locked: boolean;
  lockReason: LockReason | null;
  unlockPlans: string[];
  lockedPermissions: LockedPermission[];
  route: {
    remoteEntry: string;
    exposedModule: string;
    routePrefix: string;
  };
  // App grouping (sent by the SSE) — drives app tabs + the per-app feature side menu
  appCode: string;
  appName: string;
  appIcon: string | null;
  appSortOrder: number;
}

export interface PermissionsResponse {
  features: PermissionFeature[];
}

export interface AssignedBU {
  id: string;
  name: string;
  code: string | null;
  type: string;
  timezone: string;
  currencyCode: string;
}

export type LockReason = 'PLAN' | 'BU';

export interface LockedPermission {
  code: string;
  reason: LockReason | null;
  unlockPlans: string[];
}

export interface PermissionFeature {
  code: string;
  name: string;
  lucideIcon: string | null;
  sfSymbol: string;
  materialSymbol: string;
  permissions: string[];
  locked: boolean;
  lockReason: LockReason | null;
  unlockPlans: string[];
  lockedPermissions: LockedPermission[];
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

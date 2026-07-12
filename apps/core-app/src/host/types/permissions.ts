export type WorkspaceKind = 'site' | 'group' | 'le' | 'org';

export interface ActiveWorkspace {
  kind: WorkspaceKind;
  id: string | null;
}

export type SiteType = 'OUTLET' | 'WAREHOUSE' | 'PRODUCTION';

export interface AssignedSite {
  id: string;
  name: string;
  code: string | null;
  type: SiteType;
  timezone: string;
  currencyCode: string;
  legalEntityId: string | null;
  groupId: string | null;
}

export interface AssignedLegalEntity {
  id: string;
  name: string;
  code: string;
  country: string;
  currencyCode: string;
  taxRegime: string;
  parentId: string | null;
}

export interface AssignedSiteGroup {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
}

export interface AssignedRole {
  roleCode: string;
  roleName: string;
  targetType: 'SITE' | 'SITE_GROUP' | 'LE' | 'ORG';
  targetId: string | null;
}

export type LockReason = 'PLAN' | 'SITE';

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

export interface PermissionGateResult {
  granted: boolean;
  locked: boolean;
  reason: LockReason | null;
  unlockPlans: string[];
  available: boolean;
  featureName: string | null;
}

export type PermissionGateFn = (code: string) => PermissionGateResult;

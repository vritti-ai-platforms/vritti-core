import type { PermissionFeature } from '@vritti/quantum-ui/types/catalog-resolver';

export interface PermissionsResponse {
  features: PermissionFeature[];
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

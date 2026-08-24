import type {
  AssignedLegalEntity,
  AssignedRole,
  AssignedSite,
  AssignedSiteGroup,
  PermissionFeature,
} from './permissions';

export interface AuthStatusUser {
  id: string;
  email: string;
  fullName: string;
  status: string;
  hasPassword: boolean;
  locale: string;
  timezone: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthStatusOrg {
  id: string;
  name: string;
  subdomain: string;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
}

export interface AuthStatusResponse {
  isAuthenticated?: boolean;
  sessionId?: string;
  user?: AuthStatusUser;
  org?: AuthStatusOrg;
  sites?: AssignedSite[];
  legalEntities?: AssignedLegalEntity[];
  siteGroups?: AssignedSiteGroup[];
  assignments?: AssignedRole[];
  featuresBySiteId?: Record<string, PermissionFeature[]>;
  featuresByGroupId?: Record<string, PermissionFeature[]>;
  featuresByLeId?: Record<string, PermissionFeature[]>;
  orgFeatures?: PermissionFeature[];
}

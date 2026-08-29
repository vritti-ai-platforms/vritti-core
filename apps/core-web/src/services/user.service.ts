import axios from '@vritti/quantum-ui/axios';
import type { OrgService } from '@vritti/quantum-ui/context';
import type { PermissionFeature } from '@vritti/quantum-ui/types/catalog-resolver';
import type { AssignedLegalEntity, AssignedRole, AssignedSite, AssignedSiteGroup } from './permissions.service';

export interface User {
  id: string;
  email: string;
  fullName: string;
  displayName: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  hasPassword: boolean;
  locale?: string;
  timezone?: string;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AuthOrg {
  id: string;
  name: string;
  subdomain: string;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  // Provisioned external services — gates service-dependent features without calling the provider
  services: OrgService[];
}

export interface AuthStatusResponse {
  isAuthenticated: boolean;
  user?: User;
  accessToken?: string;
  expiresIn?: number;
  org?: AuthOrg;
  sites?: AssignedSite[];
  legalEntities?: AssignedLegalEntity[];
  siteGroups?: AssignedSiteGroup[];
  assignments?: AssignedRole[];
  featuresBySiteId?: Record<string, PermissionFeature[]>;
  featuresByGroupId?: Record<string, PermissionFeature[]>;
  featuresByLeId?: Record<string, PermissionFeature[]>;
  orgFeatures?: PermissionFeature[];
}

// Fetches the current user's authentication status
export function getAuthStatus(): Promise<AuthStatusResponse> {
  return axios
    .get<AuthStatusResponse>('auth/status', { public: true })
    .then((r: { data: AuthStatusResponse }) => r.data);
}

// Logs out the current user
export function logout(): Promise<void> {
  return axios.post('auth/logout', {}, { successMessage: 'Logged out successfully' }).then(() => undefined);
}

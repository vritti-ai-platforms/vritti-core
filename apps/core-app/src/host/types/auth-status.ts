import type { AssignedBU, PermissionFeature } from './permissions';

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
  logoUrl: string | null;
}

export interface AuthStatusResponse {
  isAuthenticated?: boolean;
  sessionId?: string;
  user?: AuthStatusUser;
  org?: AuthStatusOrg;
  businessUnits?: AssignedBU[];
  featuresByBuId?: Record<string, PermissionFeature[]>;
}

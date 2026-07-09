import axios from '@vritti/quantum-ui/axios';
import type { PermissionFeature } from '@vritti/quantum-ui/types/catalog-resolver';
import type { AssignedBU } from './permissions.service';

export interface User {
  id: string;
  externalId: string | null;
  email: string;
  fullName: string;
  displayName?: string | null;
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
  logoUrl: string | null;
}

export interface AuthStatusResponse {
  isAuthenticated: boolean;
  user?: User;
  accessToken?: string;
  expiresIn?: number;
  org?: AuthOrg;
  businessUnits?: AssignedBU[];
  featuresByBuId?: Record<string, PermissionFeature[]>;
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

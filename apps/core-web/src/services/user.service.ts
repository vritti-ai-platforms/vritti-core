import axios from '@vritti/quantum-ui/axios';

export interface User {
  id: string;
  externalId: string | null;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  hasPassword: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AuthStatusResponse {
  isAuthenticated: boolean;
  user?: User;
  accessToken?: string;
  expiresIn?: number;
}

// Fetches the current user's authentication status
export function getAuthStatus(): Promise<AuthStatusResponse> {
  return axios
    .get<AuthStatusResponse>('auth/status', { public: true })
    .then((r: { data: AuthStatusResponse }) => r.data);
}

// Logs out the current user
export function logout(): Promise<void> {
  return axios
    .post('auth/logout', {}, { successMessage: 'Logged out successfully' })
    .then(() => undefined);
}

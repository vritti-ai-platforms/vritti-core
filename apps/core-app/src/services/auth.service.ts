import { axios } from '@vritti/quantum-ui-native/utils';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  isAuthenticated: boolean;
}

export interface LoginDto {
  email: string;
  password: string;
  organizationId: string;
}

export interface LookupOrganization {
  id: string;
  name: string;
  subdomain: string;
  logoUrl: string | null;
}

export interface LookupResponse {
  organizations: LookupOrganization[];
}

// Authenticates with email/password via the mobile auth endpoint
export function login(dto: LoginDto): Promise<LoginResponse> {
  return axios
    .post<LoginResponse>('auth/mobile/login', dto, { public: true })
    .then((r) => r.data);
}

// Looks up organizations for an email address
export function lookupOrganizations(email: string): Promise<LookupResponse> {
  return axios
    .post<LookupResponse>('auth/mobile/lookup', { email }, { public: true })
    .then((r) => r.data);
}

// Invalidates the current mobile session
export function logout(): Promise<void> {
  return axios.post('auth/mobile/logout').then(() => undefined);
}

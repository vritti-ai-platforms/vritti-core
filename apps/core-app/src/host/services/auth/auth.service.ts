import { axios } from '@vritti/quantum-ui-native/utils';
import { buildPublicApiBaseURL } from './deployment.service';

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

export interface LookupOrganizationsDto {
  email: string;
  deploymentBaseURL: string;
}

export const login = (dto: LoginDto): Promise<LoginResponse> => {
  return axios.post<LoginResponse>('auth/mobile/login', dto, { public: true }).then((r) => r.data);
};

export const lookupOrganizations = ({ email, deploymentBaseURL }: LookupOrganizationsDto): Promise<LookupResponse> => {
  return axios
    .get<LookupResponse>('users/organizations-by-email', {
      baseURL: buildPublicApiBaseURL(deploymentBaseURL),
      params: { email },
      public: true,
    })
    .then((r) => r.data);
};

export const logout = (): Promise<void> => {
  return axios.post('auth/mobile/logout').then(() => undefined);
};

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
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
}

export interface LookupResponse {
  organizations: LookupOrganization[];
}

export interface LookupOrganizationsDto {
  email: string;
}

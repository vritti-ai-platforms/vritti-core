// Auth network calls moved to GraphQL (Apollo): see hooks/auth/useLogin, useLogout,
// useLookupOrganizations and the colocated gql documents in hooks/auth/graphql.ts.
// These TypeScript types remain the shared contract consumed by the auth hooks and
// the auth flow screens/providers; they mirror the GraphQL schema's mobile auth shapes.

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
}

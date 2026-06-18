import { gql } from "@apollo/client";

// Colocated GraphQL documents for the auth flow. These run against the already-selected
// deployment: Apollo's authLink sets the per-request `uri` from the stored tenant base URL,
// so no base-URL argument is threaded through here. Field selections mirror the existing
// TS contracts in services/auth/auth.service.ts.

export const ORGANIZATIONS_BY_EMAIL = gql`
  query OrganizationsByEmail($email: String!) {
    organizationsByEmail(email: $email) {
      id
      name
      subdomain
      logoUrl
    }
  }
`;

export const MOBILE_LOGIN = gql`
  mutation MobileLogin($input: MobileLoginInput!) {
    mobileLogin(input: $input) {
      accessToken
      refreshToken
      expiresIn
      isAuthenticated
    }
  }
`;

export const MOBILE_LOGOUT = gql`
  mutation MobileLogout {
    mobileLogout {
      message
      success
    }
  }
`;

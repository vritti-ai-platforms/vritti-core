import { gql } from '@apollo/client';

// Auth-flow GraphQL documents. These run against the already-selected deployment: Apollo's authLink sets
// the per-request `uri` from the stored tenant base URL, so no base-URL argument is threaded through.
// Field selections mirror the TS contracts in services/auth/auth.service.ts.
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

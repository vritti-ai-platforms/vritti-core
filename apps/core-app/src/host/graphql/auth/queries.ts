import { gql } from '@apollo/client';

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

import { useLazyQuery } from '@apollo/client/react';
import { ORGANIZATIONS_BY_EMAIL } from '../../graphql/auth';
import type { LookupOrganization } from '../../services/auth';

interface OrganizationsByEmailData {
  organizationsByEmail: LookupOrganization[];
}

interface OrganizationsByEmailVariables {
  email: string;
}

// Looks up organizations for an email against the already-selected deployment; lazy so the auth flow triggers it on form submit.
export function useLookupOrganizations() {
  return useLazyQuery<OrganizationsByEmailData, OrganizationsByEmailVariables>(ORGANIZATIONS_BY_EMAIL, {
    fetchPolicy: 'network-only',
  });
}

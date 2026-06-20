import { useLazyQuery } from '@apollo/client/react';
import { ORGANIZATIONS_BY_EMAIL } from '../../graphql/auth';
import type { LookupOrganization } from '../../services/auth';

interface OrganizationsByEmailData {
  organizationsByEmail: LookupOrganization[];
}

interface OrganizationsByEmailVariables {
  email: string;
}

// Looks up organizations for an email against the already-selected deployment (Apollo's
// authLink resolves the tenant base URL per request). Lazy so the auth flow triggers it
// imperatively on form submit, mirroring the previous mutateAsync call site.
export function useLookupOrganizations() {
  return useLazyQuery<OrganizationsByEmailData, OrganizationsByEmailVariables>(ORGANIZATIONS_BY_EMAIL, {
    fetchPolicy: 'network-only',
  });
}

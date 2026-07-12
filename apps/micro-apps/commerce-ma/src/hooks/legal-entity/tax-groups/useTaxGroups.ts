import { useQuery } from '@apollo/client/react';
import { TAX_GROUPS_QUERY } from '../../../graphql/tax-groups';

// Plain list of tax groups (small/bounded — no infinite pagination). cache-and-network so a restored
// snapshot renders instantly then revalidates. Optional search is forwarded to the server.
export function useTaxGroups(search?: string) {
  return useQuery(TAX_GROUPS_QUERY, {
    variables: { search: search || undefined },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });
}

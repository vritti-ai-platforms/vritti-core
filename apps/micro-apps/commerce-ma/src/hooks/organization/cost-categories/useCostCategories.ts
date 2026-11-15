import { useQuery } from '@apollo/client/react';
import { COST_CATEGORIES_QUERY } from '../../../graphql/cost-categories';

// Plain list of cost categories (small/bounded — no infinite pagination). cache-and-network so a restored
// snapshot renders instantly then revalidates. Optional search (name/code) is forwarded to the server.
export function useCostCategories(search?: string) {
  return useQuery(COST_CATEGORIES_QUERY, {
    variables: { search: search || undefined },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });
}

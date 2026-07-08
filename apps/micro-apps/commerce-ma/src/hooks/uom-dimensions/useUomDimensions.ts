import { useQuery } from '@apollo/client/react';
import { UOM_DIMENSIONS_QUERY } from '../../graphql/uom-dimensions';

// Plain list of UOM dimensions (small/bounded — no infinite pagination). cache-and-network so a restored
// snapshot renders instantly then revalidates. Optional search is forwarded to the server.
export function useUomDimensions(search?: string) {
  return useQuery(UOM_DIMENSIONS_QUERY, {
    variables: { search: search || undefined },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });
}

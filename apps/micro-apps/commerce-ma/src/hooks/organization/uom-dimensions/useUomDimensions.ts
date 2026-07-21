import { ORG_UOM } from '@vritti/commerce-permissions/uom';
import { useQuery } from '@apollo/client/react';
import { usePermission } from '@vritti/quantum-ui-native/context';
import { UOM_DIMENSIONS_QUERY } from '../../../graphql/uom-dimensions';

// Plain list of UOM dimensions (small/bounded — no infinite pagination). cache-and-network so a restored
// snapshot renders instantly then revalidates. Optional search is forwarded to the server. Skipped when the
// view is plan-locked so a locked list (paywalled FlashList) never hits the API.
export function useUomDimensions(search?: string) {
  const { available } = usePermission(ORG_UOM.dim.view);
  return useQuery(UOM_DIMENSIONS_QUERY, {
    variables: { search: search || undefined },
    skip: !available,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });
}

import { ORG_UOM } from '@vritti/commerce-permissions/uom';
import { useQuery } from '@apollo/client/react';
import { usePermission } from '@vritti/quantum-ui-native/context';
import { UOM_DIMENSION_QUERY } from '../../../graphql/uom-dimensions';

// Single dimension by id for the detail screen. cache-and-network: the by-id read redirect serves the
// cached record instantly (list → detail) while revalidating in the background. Skipped when the dimension
// view is plan-locked so no API hit under a lock.
export function useUomDimension(id: string | undefined) {
  const { available } = usePermission(ORG_UOM.dim.view);
  return useQuery(UOM_DIMENSION_QUERY, {
    variables: { id: id ?? '' },
    skip: !id || !available,
    fetchPolicy: 'cache-and-network',
  });
}

import { useQuery } from '@tanstack/react-query';
import { SITE_LOCATIONS } from '@vritti/commerce-permissions/locations';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { LocationItemsTableResponse } from '@/schemas/locations';
import { getLocationItemsTable } from '@/services/site/locations.service';
import { LOCATION_ITEMS_TABLE_KEY } from './keys';

export function useLocationItemsTable(locationId: string | null) {
  // The items table endpoint is guarded by locations.quants.view — self-gate the request
  const { available } = usePermission(SITE_LOCATIONS.quants.view);
  return useQuery<LocationItemsTableResponse, AxiosError>({
    queryKey: LOCATION_ITEMS_TABLE_KEY(locationId ?? ''),
    queryFn: () => getLocationItemsTable(locationId as string),
    enabled: !!locationId && available,
  });
}

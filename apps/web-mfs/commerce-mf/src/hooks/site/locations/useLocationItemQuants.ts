import { useQuery } from '@tanstack/react-query';
import { SITE_LOCATIONS } from '@vritti/commerce-permissions/locations';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import type { AxiosError } from 'axios';
import type { LocationItemQuantRow } from '@/schemas/locations';
import { getLocationItemQuants } from '@/services/site/locations.service';
import { LOCATION_ITEM_QUANTS_KEY } from './keys';

export function useLocationItemQuants(locationId: string, itemId: string, options?: { enabled?: boolean }) {
  // The quants endpoint is guarded by locations.quants.view — self-gate the request
  const { available } = usePermission(SITE_LOCATIONS.quants.view);
  return useQuery<LocationItemQuantRow[], AxiosError>({
    queryKey: LOCATION_ITEM_QUANTS_KEY(locationId, itemId),
    queryFn: () => getLocationItemQuants(locationId, itemId),
    enabled: (options?.enabled ?? true) && available,
  });
}

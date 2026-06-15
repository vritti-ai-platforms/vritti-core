import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { LocationItemQuantRow } from '@/schemas/locations';
import { getLocationItemQuants } from '@/services/locations.service';
import { LOCATION_ITEM_QUANTS_KEY } from './keys';

export function useLocationItemQuants(locationId: string, itemId: string, options?: { enabled?: boolean }) {
  return useQuery<LocationItemQuantRow[], AxiosError>({
    queryKey: LOCATION_ITEM_QUANTS_KEY(locationId, itemId),
    queryFn: () => getLocationItemQuants(locationId, itemId),
    enabled: options?.enabled ?? true,
  });
}

import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { LocationItemsTableResponse } from '@/schemas/locations';
import { getLocationItemsTable } from '@/services/locations.service';
import { LOCATION_ITEMS_TABLE_KEY } from './keys';

export function useLocationItemsTable(locationId: string | null) {
  return useQuery<LocationItemsTableResponse, AxiosError>({
    queryKey: LOCATION_ITEMS_TABLE_KEY(locationId ?? ''),
    queryFn: () => getLocationItemsTable(locationId as string),
    enabled: !!locationId,
  });
}

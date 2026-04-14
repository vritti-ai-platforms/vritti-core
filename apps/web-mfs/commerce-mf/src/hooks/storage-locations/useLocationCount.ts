import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StorageLocationCountData } from '@/schemas/storage-locations';
import { getLocationCount } from '@/services/storage-locations.service';
import { LOCATIONS_KEY } from './useLocations';

export const LOCATION_COUNT_KEY = [...LOCATIONS_KEY, 'count'] as const;

export function useLocationCount() {
	return useSuspenseQuery<StorageLocationCountData, AxiosError>({
		queryKey: LOCATION_COUNT_KEY,
		queryFn: () => getLocationCount(),
	});
}

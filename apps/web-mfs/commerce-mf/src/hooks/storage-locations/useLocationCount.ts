import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StorageLocationCountData } from '@/schemas/storage-locations';
import { getLocationCount } from '@/services/storage-locations.service';
import { LOCATION_COUNT_KEY } from './keys';

export function useLocationCount() {
	return useSuspenseQuery<StorageLocationCountData, AxiosError>({
		queryKey: LOCATION_COUNT_KEY,
		queryFn: () => getLocationCount(),
	});
}

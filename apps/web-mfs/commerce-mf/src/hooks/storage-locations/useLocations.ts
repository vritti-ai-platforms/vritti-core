import { useSuspenseQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StorageLocationData } from '@/schemas/storage-locations';
import { listLocations } from '@/services/storage-locations.service';

export const LOCATIONS_KEY = ['commerce', 'storage-locations'] as const;

export function useLocations() {
	return useSuspenseQuery<StorageLocationData[], AxiosError>({
		queryKey: [...LOCATIONS_KEY],
		queryFn: () => listLocations(),
	});
}

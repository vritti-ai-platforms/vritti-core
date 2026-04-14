import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StorageLocationData } from '@/schemas/storage-locations';
import { getLocationById } from '@/services/storage-locations.service';
import { LOCATIONS_KEY } from './useLocations';

export function useLocationById(id: string | null) {
	return useQuery<StorageLocationData, AxiosError>({
		queryKey: [...LOCATIONS_KEY, 'detail', id],
		queryFn: () => getLocationById(id as string),
		enabled: !!id,
	});
}


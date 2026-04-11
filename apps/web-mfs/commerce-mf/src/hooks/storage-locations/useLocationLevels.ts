import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { LocationStockData } from '@/schemas/storage-locations';
import { getLocationLevels } from '@/services/storage-locations.service';

export function useLocationLevels(id: string | null) {
	return useQuery<LocationStockData[], AxiosError>({
		queryKey: ['commerce', 'storage-locations', id, 'levels'],
		queryFn: () => getLocationLevels(id as string),
		enabled: !!id,
	});
}

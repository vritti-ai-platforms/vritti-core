import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StorageLocationData } from '@/schemas/storage-locations';
import { getLocation } from '@/services/storage-locations.service';

export function useLocation(id: string | null) {
	return useQuery<StorageLocationData, AxiosError>({
		queryKey: ['commerce', 'storage-locations', id],
		queryFn: () => getLocation(id as string),
		enabled: !!id,
	});
}

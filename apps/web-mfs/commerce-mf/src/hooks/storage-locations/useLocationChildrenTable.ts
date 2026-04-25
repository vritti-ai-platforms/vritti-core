import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StorageLocationChildrenTableResponse } from '@/schemas/storage-locations';
import { getLocationChildrenTable } from '@/services/storage-locations.service';
import { LOCATION_CHILDREN_TABLE_KEY } from './keys';

export function useLocationChildrenTable(parentId: string | null) {
	return useQuery<StorageLocationChildrenTableResponse, AxiosError>({
		queryKey: LOCATION_CHILDREN_TABLE_KEY(parentId ?? ''),
		queryFn: () => getLocationChildrenTable(parentId as string),
		enabled: !!parentId,
	});
}

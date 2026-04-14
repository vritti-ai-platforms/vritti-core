import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StorageLocationChildrenTableResponse } from '@/schemas/storage-locations';
import { getLocationChildrenTable } from '@/services/storage-locations.service';
import { LOCATIONS_KEY } from './keys';

export const LOCATION_CHILDREN_TABLE_KEY = (parentId: string) => [...LOCATIONS_KEY, parentId, 'children-table'] as const;

export function useLocationChildrenTable(parentId: string | null) {
	return useQuery<StorageLocationChildrenTableResponse, AxiosError>({
		queryKey: LOCATION_CHILDREN_TABLE_KEY(parentId ?? ''),
		queryFn: () => getLocationChildrenTable(parentId as string),
		enabled: !!parentId,
	});
}

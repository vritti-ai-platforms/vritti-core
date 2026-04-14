import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { StorageLocationTreeNode } from '@/schemas/storage-locations';
import { listLocationTree } from '@/services/storage-locations.service';
import { LOCATIONS_KEY } from './useLocations';

export const LOCATION_TREE_KEY = [...LOCATIONS_KEY, 'tree'] as const;

export function useLocationTree(search?: string) {
	return useQuery<StorageLocationTreeNode[], AxiosError>({
		queryKey: [...LOCATION_TREE_KEY, search ?? ''],
		queryFn: () => listLocationTree(search),
	});
}

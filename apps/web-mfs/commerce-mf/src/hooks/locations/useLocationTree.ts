import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { LocationTreeNode } from '@/schemas/locations';
import { listLocationTree } from '@/services/locations.service';
import { LOCATION_TREE_KEY } from './keys';

export function useLocationTree(search?: string) {
	return useQuery<LocationTreeNode[], AxiosError>({
		queryKey: [...LOCATION_TREE_KEY, search ?? ''],
		queryFn: () => listLocationTree(search),
	});
}

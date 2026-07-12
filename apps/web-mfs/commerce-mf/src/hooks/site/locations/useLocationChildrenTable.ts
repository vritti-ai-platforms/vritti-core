import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { LocationChildrenTableResponse } from '@/schemas/locations';
import { getLocationChildrenTable } from '@/services/site/locations.service';
import { LOCATION_CHILDREN_TABLE_KEY } from './keys';

export function useLocationChildrenTable(parentId: string | null) {
  return useQuery<LocationChildrenTableResponse, AxiosError>({
    queryKey: LOCATION_CHILDREN_TABLE_KEY(parentId ?? ''),
    queryFn: () => getLocationChildrenTable(parentId as string),
    enabled: !!parentId,
  });
}

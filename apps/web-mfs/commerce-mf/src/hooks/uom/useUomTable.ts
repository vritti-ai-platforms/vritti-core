import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { UomTableResponse } from '@/schemas/uom';
import { getUomTable } from '@/services/uom.service';
import { UOM_TABLE_KEY } from './keys';

export function useUomTable(
  dimensionId: string | null,
  options?: Omit<UseQueryOptions<UomTableResponse, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<UomTableResponse, AxiosError>({
    queryKey: [...UOM_TABLE_KEY, dimensionId],
    queryFn: () => getUomTable(dimensionId as string),
    enabled: !!dimensionId,
    ...options,
  });
}

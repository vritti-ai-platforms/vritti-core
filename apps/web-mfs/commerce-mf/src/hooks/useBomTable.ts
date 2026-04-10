import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { BomTableResponse } from '@/schemas/bom';
import { getBomTable } from '@/services/bom.service';

export const BOM_TABLE_KEY = ['commerce', 'bom', 'table'] as const;

// Fetches BOM table data
export function useBomTable(
  options?: Omit<UseQueryOptions<BomTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<BomTableResponse, AxiosError>({
    queryKey: [...BOM_TABLE_KEY],
    queryFn: getBomTable,
    ...options,
  });
}

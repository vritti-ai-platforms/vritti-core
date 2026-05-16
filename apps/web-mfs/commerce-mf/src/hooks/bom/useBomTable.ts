import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { BomTableResponse } from '@/schemas/bom';
import { getBomTable } from '@/services/bom.service';

import { BOM_TABLE_KEY } from './keys';

// Fetches BOM table data
export function useBomTable(options?: Omit<UseQueryOptions<BomTableResponse, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery<BomTableResponse, AxiosError>({
    queryKey: [...BOM_TABLE_KEY],
    queryFn: getBomTable,
    ...options,
  });
}

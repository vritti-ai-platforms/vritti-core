import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { BomDetail } from '@/schemas/bom';
import { getBom } from '@/services/bom.service';
import { BOM_DETAIL_KEY } from './keys';

// Fetches BOM detail with lines
export function useBom(
  id: string | null,
  options?: Omit<UseQueryOptions<BomDetail, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<BomDetail, AxiosError>({
    queryKey: BOM_DETAIL_KEY(id ?? ''),
    queryFn: () => getBom(id as string),
    enabled: !!id,
    ...options,
  });
}

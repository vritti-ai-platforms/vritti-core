import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ConversionDetail } from '@/schemas/conversions';
import { getConversion } from '@/services/conversions.service';
import { CONVERSION_KEY } from './keys';

export function useConversion(
  id: string | null,
  options?: Omit<UseQueryOptions<ConversionDetail, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<ConversionDetail, AxiosError>({
    queryKey: CONVERSION_KEY(id ?? ''),
    queryFn: () => getConversion(id as string),
    enabled: !!id,
    ...options,
  });
}

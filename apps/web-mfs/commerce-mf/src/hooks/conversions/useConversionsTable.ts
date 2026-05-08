import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ConversionsTableResponse } from '@/schemas/conversions';
import { getConversionsTable } from '@/services/conversions.service';
import { CONVERSIONS_TABLE_KEY } from './keys';

export function useConversionsTable(
  options?: Omit<UseQueryOptions<ConversionsTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<ConversionsTableResponse, AxiosError>({
    queryKey: CONVERSIONS_TABLE_KEY,
    queryFn: getConversionsTable,
    ...options,
  });
}

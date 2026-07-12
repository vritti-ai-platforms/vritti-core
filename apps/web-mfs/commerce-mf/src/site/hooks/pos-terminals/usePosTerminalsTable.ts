import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PosTerminalTableResponse } from '@/schemas/pos-terminals';
import { getPosTerminalsTable } from '@/site/services/pos-terminals.service';
import { POS_TERMINALS_TABLE_KEY } from './keys';

export function usePosTerminalsTable(
  options?: Omit<UseQueryOptions<PosTerminalTableResponse, AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<PosTerminalTableResponse, AxiosError>({
    queryKey: POS_TERMINALS_TABLE_KEY,
    queryFn: getPosTerminalsTable,
    ...options,
  });
}

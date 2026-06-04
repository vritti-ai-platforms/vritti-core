import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { PosTerminalData } from '@/schemas/pos-terminals';
import { getPosTerminal } from '@/services/pos-terminals.service';
import { POS_TERMINAL_KEY } from './keys';

export function usePosTerminal(
  id: string | null,
  options?: Omit<UseQueryOptions<PosTerminalData, AxiosError>, 'queryKey' | 'queryFn' | 'enabled'>,
) {
  return useQuery<PosTerminalData, AxiosError>({
    queryKey: [...POS_TERMINAL_KEY, id],
    queryFn: () => getPosTerminal(id as string),
    enabled: !!id,
    ...options,
  });
}

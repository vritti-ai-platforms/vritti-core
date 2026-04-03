import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SessionData } from '@services/account/security.service';
import { getSessions } from '@services/account/security.service';

export const SESSIONS_QUERY_KEY = ['account', 'sessions'] as const;

export function useSessions(
  options?: Omit<UseQueryOptions<SessionData[], AxiosError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<SessionData[], AxiosError>({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: getSessions,
    ...options,
  });
}

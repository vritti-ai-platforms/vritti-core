import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type SessionData, getSessions } from '../../services/account/security.service';

export const SESSIONS_QUERY_KEY = ['account', 'sessions'] as const;

type UseSessionsOptions = Omit<UseQueryOptions<SessionData[], AxiosError>, 'queryKey' | 'queryFn'>;

export function useSessions(options?: UseSessionsOptions) {
  return useQuery<SessionData[], AxiosError>({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: getSessions,
    ...options,
  });
}

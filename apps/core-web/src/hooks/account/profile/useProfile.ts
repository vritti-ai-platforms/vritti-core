import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ProfileData } from '@/schemas/account';
import { getProfile } from '@/services/account/profile.service';

export const PROFILE_QUERY_KEY = ['profile'] as const;

export function useProfile(options?: Omit<UseQueryOptions<ProfileData, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery<ProfileData, AxiosError>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
    staleTime: Number.POSITIVE_INFINITY,
    ...options,
  });
}

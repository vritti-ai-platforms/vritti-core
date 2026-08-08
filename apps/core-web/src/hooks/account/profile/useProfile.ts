import type { UseQueryOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ProfileData } from '@/schemas/account';
import { getProfile } from '@/services/account/profile.service';

export const PROFILE_QUERY_KEY = ['profile'] as const;

// The profile carries a presigned photo URL that expires on the server's MEDIA_SIGNED_URL_EXPIRY. Caching the profile
// forever would leave a long-lived tab rendering a dead URL with no refetch to repair it, so staleness is bounded well
// inside any sane expiry rather than left infinite.
const PROFILE_STALE_TIME = 5 * 60 * 1000;

export function useProfile(options?: Omit<UseQueryOptions<ProfileData, AxiosError>, 'queryKey' | 'queryFn'>) {
  return useQuery<ProfileData, AxiosError>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
    staleTime: PROFILE_STALE_TIME,
    ...options,
  });
}

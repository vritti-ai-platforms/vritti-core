import { type UseMutationOptions, type UseQueryOptions, useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type AuthStatusResponse, getAuthStatus, logout } from '@services/user.service';

type UseAuthStatusOptions = Omit<UseQueryOptions<AuthStatusResponse, AxiosError>, 'queryKey' | 'queryFn'>;

export function useAuthStatus(options?: UseAuthStatusOptions) {
  return useQuery<AuthStatusResponse, AxiosError>({
    queryKey: ['auth', 'status'],
    queryFn: getAuthStatus,
    staleTime: Infinity,
    retry: false,
    ...options,
  });
}

type UseLogoutOptions = Omit<UseMutationOptions<void, AxiosError, void>, 'mutationFn'>;

export function useLogout(options?: UseLogoutOptions) {
  return useMutation<void, AxiosError, void>({
    mutationFn: logout,
    ...options,
  });
}

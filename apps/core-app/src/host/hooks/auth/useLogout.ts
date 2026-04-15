import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { clearTokens } from '@vritti/quantum-ui-native/utils';
import { logout } from '../../services/auth.service';

type UseLogoutOptions = Omit<UseMutationOptions<void, AxiosError, void>, 'mutationFn'>;

// Logs out and clears all stored tokens
export function useLogout(options?: UseLogoutOptions) {
  return useMutation<void, AxiosError, void>({
    ...options,
    mutationFn: logout,
    onSuccess: async (...args) => {
      await clearTokens();
      options?.onSuccess?.(...args);
    },
  });
}

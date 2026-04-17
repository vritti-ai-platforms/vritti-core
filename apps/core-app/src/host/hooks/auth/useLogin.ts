import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { completeMobileLoginSession } from '@vritti/quantum-ui-native/utils';
import { type LoginDto, type LoginResponse, login } from '../../services/auth/auth.service';

type UseLoginOptions = Omit<UseMutationOptions<LoginResponse, AxiosError, LoginDto>, 'mutationFn'>;

// Authenticates and stores tokens on success
export function useLogin(options?: UseLoginOptions) {
  return useMutation<LoginResponse, AxiosError, LoginDto>({
    ...options,
    mutationFn: login,
    onSuccess: async (...args) => {
      await completeMobileLoginSession(args[0]);
      options?.onSuccess?.(...args);
    },
  });
}

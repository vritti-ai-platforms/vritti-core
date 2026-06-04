import { type ResetPasswordResponse, resetPassword } from '@services/auth.service';
import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

type UseResetPasswordOptions = Omit<UseMutationOptions<ResetPasswordResponse, AxiosError, string>, 'mutationFn'>;

// Resets password using the RESET session Bearer token and returns a new session
export function useResetPassword(options?: UseResetPasswordOptions) {
  return useMutation<ResetPasswordResponse, AxiosError, string>({
    mutationFn: resetPassword,
    ...options,
  });
}

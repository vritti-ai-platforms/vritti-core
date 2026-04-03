import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SuccessResponse } from '@services/account/security.service';
import { changePassword } from '@services/account/security.service';

export function useChangePassword(
  options?: Omit<
    UseMutationOptions<SuccessResponse, AxiosError, { currentPassword: string; newPassword: string }>,
    'mutationFn'
  >,
) {
  return useMutation<SuccessResponse, AxiosError, { currentPassword: string; newPassword: string }>({
    mutationFn: changePassword,
    ...options,
  });
}

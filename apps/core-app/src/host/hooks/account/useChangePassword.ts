import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type ChangePasswordDto, changePassword, type SuccessResponse } from '../../services/account/security.service';

type UseChangePasswordOptions = Omit<UseMutationOptions<SuccessResponse, AxiosError, ChangePasswordDto>, 'mutationFn'>;

export const useChangePassword = (options?: UseChangePasswordOptions) => {
  return useMutation<SuccessResponse, AxiosError, ChangePasswordDto>({
    ...options,
    mutationFn: changePassword,
  });
};

import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type LoginDto, type LoginResponse, login } from '@services/auth.service';

type UseLoginOptions = Omit<UseMutationOptions<LoginResponse, AxiosError, LoginDto>, 'mutationFn'>;

export function useLogin(options?: UseLoginOptions) {
  return useMutation<LoginResponse, AxiosError, LoginDto>({
    mutationFn: login,
    ...options,
  });
}

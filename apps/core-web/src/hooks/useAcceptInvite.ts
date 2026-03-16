import { type AcceptInviteDto, acceptInvite, type SuccessResponse } from '@services/auth.service';
import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

type UseAcceptInviteOptions = Omit<UseMutationOptions<SuccessResponse, AxiosError, AcceptInviteDto>, 'mutationFn'>;

// Accepts an organization invite by setting the user password
export function useAcceptInvite(options?: UseAcceptInviteOptions) {
  return useMutation<SuccessResponse, AxiosError, AcceptInviteDto>({
    mutationFn: acceptInvite,
    ...options,
  });
}

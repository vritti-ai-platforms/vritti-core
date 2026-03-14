import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type AcceptInviteDto, type SuccessResponse, acceptInvite } from '@services/auth.service';

type UseAcceptInviteOptions = Omit<UseMutationOptions<SuccessResponse, AxiosError, AcceptInviteDto>, 'mutationFn'>;

// Accepts an organization invite by setting the user password
export function useAcceptInvite(options?: UseAcceptInviteOptions) {
  return useMutation<SuccessResponse, AxiosError, AcceptInviteDto>({
    mutationFn: acceptInvite,
    ...options,
  });
}

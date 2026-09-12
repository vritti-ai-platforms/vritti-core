import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteAppChannel } from '@/services/organization/app-catalog-channels.service';
import { APP_CHANNEL_KEY } from './keys';

export function useDeleteAppChannel(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteAppChannel,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: APP_CHANNEL_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

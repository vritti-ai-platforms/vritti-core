import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { deleteSalesChannel } from '@/services/sales-channels.service';
import { SALES_CHANNELS_TABLE_KEY } from './keys';

export function useDeleteSalesChannel(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, string>({
    ...options,
    mutationFn: deleteSalesChannel,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SALES_CHANNELS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

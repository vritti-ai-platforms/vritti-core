import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SalesChannelData } from '@/schemas/sales-channels';
import { type CreateSalesChannelPayload, createSalesChannel } from '@/services/sales-channels.service';
import { SALES_CHANNELS_TABLE_KEY } from './keys';

export function useCreateSalesChannel(
  options?: Omit<UseMutationOptions<SalesChannelData, AxiosError, CreateSalesChannelPayload>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();
  return useMutation<SalesChannelData, AxiosError, CreateSalesChannelPayload>({
    ...options,
    mutationFn: createSalesChannel,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SALES_CHANNELS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

import type { UseMutationOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import type { AxiosError } from 'axios';
import { type UpdateSalesChannelPayload, updateSalesChannel } from '@/services/sales-channels.service';
import { SALES_CHANNEL_KEY, SALES_CHANNELS_TABLE_KEY } from './keys';

interface Vars {
  id: string;
  data: UpdateSalesChannelPayload;
}

export function useUpdateSalesChannel(options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, Vars>, 'mutationFn'>) {
  const queryClient = useQueryClient();
  return useMutation<SuccessResponse, AxiosError, Vars>({
    ...options,
    mutationFn: updateSalesChannel,
    onSuccess: (...args) => {
      const [, vars] = args;
      queryClient.invalidateQueries({ queryKey: SALES_CHANNELS_TABLE_KEY });
      queryClient.invalidateQueries({ queryKey: SALES_CHANNEL_KEY(vars.id) });
      options?.onSuccess?.(...args);
    },
  });
}

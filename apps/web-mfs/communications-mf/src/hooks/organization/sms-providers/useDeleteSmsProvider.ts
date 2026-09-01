import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteSmsProvider } from '@/services/organization/sms-providers.service';
import { SMS_PROVIDERS_TABLE_KEY } from './keys';

export function useDeleteSmsProvider(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: deleteSmsProvider,
    ...options,
    onSuccess: (...args) => {
      // The table only — NOT the SMS_PROVIDERS_KEY prefix, which also covers the deleted row's own
      // detail query. That query is still mounted when this fires, so invalidating it refetches
      // straight into a 404; the caller navigates away instead.
      queryClient.invalidateQueries({ queryKey: SMS_PROVIDERS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

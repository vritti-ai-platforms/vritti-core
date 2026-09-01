import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdateSmsProviderData } from '@/schemas/sms-providers';
import { updateSmsProvider } from '@/services/organization/sms-providers.service';
import { SMS_PROVIDERS_KEY } from './keys';

interface UpdateSmsProviderVariables {
  id: string;
  data: UpdateSmsProviderData;
}

export function useUpdateSmsProvider(
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, UpdateSmsProviderVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, UpdateSmsProviderVariables>({
    mutationFn: ({ id, data }) => updateSmsProvider(id, data),
    ...options,
    onSuccess: (...args) => {
      // Prefix invalidation covers both the table and the updated row's detail query
      queryClient.invalidateQueries({ queryKey: SMS_PROVIDERS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

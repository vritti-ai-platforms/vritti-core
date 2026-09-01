import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateSmsProviderData, SmsProviderData } from '@/schemas/sms-providers';
import { createSmsProvider } from '@/services/organization/sms-providers.service';
import { SMS_PROVIDERS_TABLE_KEY } from './keys';

export function useCreateSmsProvider(
  options?: Omit<UseMutationOptions<CreateResponse<SmsProviderData>, AxiosError, CreateSmsProviderData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<SmsProviderData>, AxiosError, CreateSmsProviderData>({
    mutationFn: createSmsProvider,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SMS_PROVIDERS_TABLE_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

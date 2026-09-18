import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { AddSmsProviderTemplateData, SmsProviderTemplateData } from '@/schemas/sms-provider-templates';
import { addSmsProviderTemplate } from '@/services/organization/sms-provider-templates.service';
import { SMS_PROVIDER_TEMPLATES_KEY } from './keys';

type Result = CreateResponse<SmsProviderTemplateData>;

export function useAddSmsProviderTemplate(
  providerId: string,
  options?: Omit<UseMutationOptions<Result, AxiosError, AddSmsProviderTemplateData>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<Result, AxiosError, AddSmsProviderTemplateData>({
    mutationFn: (data) => addSmsProviderTemplate(providerId, data),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SMS_PROVIDER_TEMPLATES_KEY(providerId) });
      options?.onSuccess?.(...args);
    },
  });
}

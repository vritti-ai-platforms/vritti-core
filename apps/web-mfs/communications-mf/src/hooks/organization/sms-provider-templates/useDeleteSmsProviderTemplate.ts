import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteSmsProviderTemplate } from '@/services/organization/sms-provider-templates.service';
import { SMS_PROVIDER_TEMPLATES_KEY } from './keys';

export function useDeleteSmsProviderTemplate(
  providerId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, string>({
    mutationFn: (templateId) => deleteSmsProviderTemplate(providerId, templateId),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SMS_PROVIDER_TEMPLATES_KEY(providerId) });
      options?.onSuccess?.(...args);
    },
  });
}

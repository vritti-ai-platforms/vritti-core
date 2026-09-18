import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { SmsProviderTemplateData } from '@/schemas/sms-provider-templates';
import { refreshSmsProviderTemplate } from '@/services/organization/sms-provider-templates.service';
import { SMS_PROVIDER_TEMPLATES_KEY } from './keys';

// Re-reads one template from the vendor so an edit made in the MSG91 panel stops being stale here
export function useRefreshSmsProviderTemplate(
  providerId: string,
  options?: Omit<UseMutationOptions<SmsProviderTemplateData, AxiosError, string>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SmsProviderTemplateData, AxiosError, string>({
    mutationFn: (templateId) => refreshSmsProviderTemplate(providerId, templateId),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: SMS_PROVIDER_TEMPLATES_KEY(providerId) });
      options?.onSuccess?.(...args);
    },
  });
}

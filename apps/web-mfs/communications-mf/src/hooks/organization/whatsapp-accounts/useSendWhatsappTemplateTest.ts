import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { SendWhatsappTemplateTestData } from '@/schemas/whatsapp-templates';
import { sendWhatsappTemplateTest } from '@/services/organization/whatsapp-templates.service';

// No cache invalidation — sending a message changes nothing in the templates table
export function useSendWhatsappTemplateTest(
  accountId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, SendWhatsappTemplateTestData>, 'mutationFn'>,
) {
  return useMutation<SuccessResponse, AxiosError, SendWhatsappTemplateTestData>({
    mutationFn: (data) => sendWhatsappTemplateTest(accountId, data),
    ...options,
  });
}

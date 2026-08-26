import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { CreateWhatsappTemplateData, WhatsappTemplateData } from '@/schemas/whatsapp-templates';
import { createWhatsappTemplate } from '@/services/organization/whatsapp-templates.service';
import { WHATSAPP_ACCOUNT_TEMPLATES_KEY } from './keys';

interface CreateWhatsappTemplateVariables {
  accountId: string;
  data: CreateWhatsappTemplateData;
}

type Options = Omit<
  UseMutationOptions<CreateResponse<WhatsappTemplateData>, AxiosError, CreateWhatsappTemplateVariables>,
  'mutationFn'
>;

export function useCreateWhatsappTemplate(options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<WhatsappTemplateData>, AxiosError, CreateWhatsappTemplateVariables>({
    mutationFn: ({ accountId, data }) => createWhatsappTemplate(accountId, data),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: WHATSAPP_ACCOUNT_TEMPLATES_KEY(args[1].accountId) });
      options?.onSuccess?.(...args);
    },
  });
}

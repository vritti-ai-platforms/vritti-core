import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { deleteWhatsappTemplate } from '@/services/organization/whatsapp-templates.service';
import { WHATSAPP_ACCOUNT_TEMPLATES_KEY } from './keys';

interface DeleteWhatsappTemplateVariables {
  templateId: string;
  name: string;
}

export function useDeleteWhatsappTemplate(
  accountId: string,
  options?: Omit<UseMutationOptions<SuccessResponse, AxiosError, DeleteWhatsappTemplateVariables>, 'mutationFn'>,
) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, DeleteWhatsappTemplateVariables>({
    mutationFn: ({ templateId, name }) => deleteWhatsappTemplate(accountId, templateId, name),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: WHATSAPP_ACCOUNT_TEMPLATES_KEY(accountId) });
      options?.onSuccess?.(...args);
    },
  });
}

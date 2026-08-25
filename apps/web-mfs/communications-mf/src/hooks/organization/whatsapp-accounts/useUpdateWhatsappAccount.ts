import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { UpdateWhatsappAccountData } from '@/schemas/whatsapp-accounts';
import { updateWhatsappAccount } from '@/services/organization/whatsapp-accounts.service';
import { WHATSAPP_ACCOUNTS_KEY } from './keys';

type Variables = { id: string; data: UpdateWhatsappAccountData };

type Options = Omit<UseMutationOptions<SuccessResponse, AxiosError, Variables>, 'mutationFn'>;

export function useUpdateWhatsappAccount(options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, Variables>({
    mutationFn: ({ id, data }) => updateWhatsappAccount(id, data),
    ...options,
    onSuccess: (...args) => {
      // The whole prefix, unlike delete: setting one account as default clears the flag on the others,
      // so every cached row is stale, not just the one that was edited.
      queryClient.invalidateQueries({ queryKey: WHATSAPP_ACCOUNTS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

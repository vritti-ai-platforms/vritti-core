import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { ConnectEmbeddedSignupData } from '@/schemas/whatsapp-accounts';
import { reconnectWhatsappAccount } from '@/services/organization/whatsapp-accounts.service';
import { WHATSAPP_ACCOUNTS_KEY } from './keys';

interface ReconnectWhatsappAccountVariables {
  id: string;
  data: ConnectEmbeddedSignupData;
}

type Options = Omit<UseMutationOptions<SuccessResponse, AxiosError, ReconnectWhatsappAccountVariables>, 'mutationFn'>;

export function useReconnectWhatsappAccount(options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, ReconnectWhatsappAccountVariables>({
    mutationFn: ({ id, data }) => reconnectWhatsappAccount(id, data),
    ...options,
    onSuccess: (...args) => {
      // The whole prefix: a fresh token revalidates the live Meta reads (phone numbers, templates)
      // that were failing on the dead one, not just the account row
      queryClient.invalidateQueries({ queryKey: WHATSAPP_ACCOUNTS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

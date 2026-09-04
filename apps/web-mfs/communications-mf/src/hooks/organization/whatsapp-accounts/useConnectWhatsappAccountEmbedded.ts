import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { ConnectEmbeddedSignupData, WhatsappAccountData } from '@/schemas/whatsapp-accounts';
import { connectWhatsappAccountEmbedded } from '@/services/organization/whatsapp-accounts.service';
import { WHATSAPP_ACCOUNTS_KEY } from './keys';

type Options = Omit<
  UseMutationOptions<CreateResponse<WhatsappAccountData>, AxiosError, ConnectEmbeddedSignupData>,
  'mutationFn'
>;

export function useConnectWhatsappAccountEmbedded(options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<WhatsappAccountData>, AxiosError, ConnectEmbeddedSignupData>({
    mutationFn: connectWhatsappAccountEmbedded,
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: WHATSAPP_ACCOUNTS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

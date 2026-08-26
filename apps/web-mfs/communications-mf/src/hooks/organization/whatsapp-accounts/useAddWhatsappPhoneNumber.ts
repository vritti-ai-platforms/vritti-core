import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { AddWhatsappPhoneNumberData, WhatsappPhoneNumberData } from '@/schemas/whatsapp-phone-numbers';
import { addWhatsappPhoneNumber } from '@/services/organization/whatsapp-phone-numbers.service';
import { WHATSAPP_ACCOUNT_PHONE_NUMBERS_KEY } from './keys';

interface AddWhatsappPhoneNumberVariables {
  accountId: string;
  data: AddWhatsappPhoneNumberData;
}

type Options = Omit<
  UseMutationOptions<CreateResponse<WhatsappPhoneNumberData>, AxiosError, AddWhatsappPhoneNumberVariables>,
  'mutationFn'
>;

export function useAddWhatsappPhoneNumber(options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<CreateResponse<WhatsappPhoneNumberData>, AxiosError, AddWhatsappPhoneNumberVariables>({
    mutationFn: ({ accountId, data }) => addWhatsappPhoneNumber(accountId, data),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: WHATSAPP_ACCOUNT_PHONE_NUMBERS_KEY(args[1].accountId) });
      options?.onSuccess?.(...args);
    },
  });
}

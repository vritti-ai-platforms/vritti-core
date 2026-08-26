import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { registerWhatsappPhoneNumber } from '@/services/organization/whatsapp-phone-numbers.service';
import { WHATSAPP_ACCOUNT_PHONE_NUMBERS_KEY } from './keys';

interface RegisterWhatsappPhoneNumberVariables {
  accountId: string;
  phoneNumberId: string;
  pin: string;
}

type Options = Omit<
  UseMutationOptions<SuccessResponse, AxiosError, RegisterWhatsappPhoneNumberVariables>,
  'mutationFn'
>;

export function useRegisterWhatsappPhoneNumber(options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, RegisterWhatsappPhoneNumberVariables>({
    mutationFn: ({ accountId, phoneNumberId, pin }) => registerWhatsappPhoneNumber(accountId, phoneNumberId, pin),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: WHATSAPP_ACCOUNT_PHONE_NUMBERS_KEY(args[1].accountId) });
      options?.onSuccess?.(...args);
    },
  });
}

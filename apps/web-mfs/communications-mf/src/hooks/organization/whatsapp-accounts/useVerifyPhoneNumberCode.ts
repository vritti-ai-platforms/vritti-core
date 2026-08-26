import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { verifyPhoneNumberCode } from '@/services/organization/whatsapp-phone-numbers.service';
import { WHATSAPP_ACCOUNT_PHONE_NUMBERS_KEY } from './keys';

interface VerifyPhoneNumberCodeVariables {
  accountId: string;
  phoneNumberId: string;
  code: string;
}

type Options = Omit<UseMutationOptions<SuccessResponse, AxiosError, VerifyPhoneNumberCodeVariables>, 'mutationFn'>;

export function useVerifyPhoneNumberCode(options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, VerifyPhoneNumberCodeVariables>({
    mutationFn: ({ accountId, phoneNumberId, code }) => verifyPhoneNumberCode(accountId, phoneNumberId, code),
    ...options,
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: WHATSAPP_ACCOUNT_PHONE_NUMBERS_KEY(args[1].accountId) });
      options?.onSuccess?.(...args);
    },
  });
}

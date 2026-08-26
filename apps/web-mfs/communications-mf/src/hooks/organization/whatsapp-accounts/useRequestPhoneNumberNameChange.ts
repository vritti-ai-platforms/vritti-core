import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import { requestWhatsappPhoneNumberNameChange } from '@/services/organization/whatsapp-phone-numbers.service';
import { WHATSAPP_ACCOUNT_PHONE_NUMBERS_KEY } from './keys';

interface RequestPhoneNumberNameChangeVariables {
  accountId: string;
  phoneNumberId: string;
  newDisplayName: string;
}

type Options = Omit<
  UseMutationOptions<SuccessResponse, AxiosError, RequestPhoneNumberNameChangeVariables>,
  'mutationFn'
>;

export function useRequestPhoneNumberNameChange(options?: Options) {
  const queryClient = useQueryClient();

  return useMutation<SuccessResponse, AxiosError, RequestPhoneNumberNameChangeVariables>({
    mutationFn: ({ accountId, phoneNumberId, newDisplayName }) =>
      requestWhatsappPhoneNumberNameChange(accountId, phoneNumberId, newDisplayName),
    ...options,
    onSuccess: (...args) => {
      // The list carries nameStatus, which flips to PENDING_REVIEW after a submission
      queryClient.invalidateQueries({ queryKey: WHATSAPP_ACCOUNT_PHONE_NUMBERS_KEY(args[1].accountId) });
      options?.onSuccess?.(...args);
    },
  });
}

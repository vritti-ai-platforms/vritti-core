import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { SuccessResponse } from '@vritti/quantum-ui/types/api-response';
import type { AxiosError } from 'axios';
import type { RequestPhoneCodeData } from '@/schemas/whatsapp-phone-numbers';
import { requestPhoneVerificationCode } from '@/services/organization/whatsapp-phone-numbers.service';

interface RequestPhoneVerificationCodeVariables {
  accountId: string;
  phoneNumberId: string;
  data: RequestPhoneCodeData;
}

type Options = Omit<
  UseMutationOptions<SuccessResponse, AxiosError, RequestPhoneVerificationCodeVariables>,
  'mutationFn'
>;

export function useRequestPhoneVerificationCode(options?: Options) {
  return useMutation<SuccessResponse, AxiosError, RequestPhoneVerificationCodeVariables>({
    mutationFn: ({ accountId, phoneNumberId, data }) => requestPhoneVerificationCode(accountId, phoneNumberId, data),
    ...options,
  });
}

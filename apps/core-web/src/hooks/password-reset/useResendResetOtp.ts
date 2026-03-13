import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type SuccessResponse, resendResetOtp } from '@services/auth.service';

type UseResendResetOtpOptions = Omit<UseMutationOptions<SuccessResponse, AxiosError, void>, 'mutationFn'>;

// Resends the reset OTP using the active RESET session Bearer token
export function useResendResetOtp(options?: UseResendResetOtpOptions) {
  return useMutation<SuccessResponse, AxiosError, void>({
    mutationFn: resendResetOtp,
    ...options,
  });
}

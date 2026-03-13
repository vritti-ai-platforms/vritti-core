import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { scheduleTokenRefresh, setToken } from '@vritti/quantum-ui/axios';
import { useState } from 'react';
import { type SuccessResponse, resendResetOtp } from '@services/auth.service';
import { useForgotPassword } from './useForgotPassword';
import { useResetPassword } from './useResetPassword';
import { useVerifyResetOtp } from './useVerifyResetOtp';

export type Step = 'email' | 'otp' | 'reset';

export function usePasswordResetFlow() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');

  // Step 1: Request password reset — stores RESET session token
  const forgotPasswordMutation = useForgotPassword({
    onSuccess: (response, emailValue) => {
      setEmail(emailValue);

      // Store RESET session token so subsequent requests send Bearer
      if (response.accessToken) {
        setToken(response.accessToken);
        if (response.expiresIn) {
          scheduleTokenRefresh(response.expiresIn);
        }
      }

      setStep('otp');
    },
  });

  // Resend OTP mutation — uses dedicated endpoint (requires Bearer)
  const resendOtpMutation = useMutation<SuccessResponse, AxiosError>({
    mutationFn: resendResetOtp,
  });

  // Step 2: Verify OTP
  const verifyOtpMutation = useVerifyResetOtp({
    onSuccess: () => {
      setStep('reset');
    },
  });

  // Step 3: Reset password — stores new session token and navigates home
  const resetPasswordMutation = useResetPassword({
    onSuccess: (response) => {
      // Store new session tokens
      setToken(response.accessToken);
      if (response.expiresIn) {
        scheduleTokenRefresh(response.expiresIn);
      }

      // Full page reload to refresh auth state and routes
      window.location.href = '/';
    },
  });

  const goBack = () => {
    if (step === 'otp') {
      setStep('email');
    }
  };

  return {
    // State
    step,
    email,
    // Mutations (for Form component integration)
    forgotPasswordMutation,
    verifyOtpMutation,
    resetPasswordMutation,
    resendOtpMutation,
    // Actions
    goBack,
  };
}

export type PasswordResetFlow = ReturnType<typeof usePasswordResetFlow>;

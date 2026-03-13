import { usePasswordResetFlow } from '@hooks/password-reset';
import type React from 'react';
import { EmailStep, OtpStep, ResetPasswordStep } from './steps';

export const ForgotPasswordPage: React.FC = () => {
  const flow = usePasswordResetFlow();

  return (
    <div className="space-y-6">
      {flow.step === 'email' && <EmailStep mutation={flow.forgotPasswordMutation} />}

      {flow.step === 'otp' && (
        <OtpStep
          email={flow.email}
          goBack={flow.goBack}
          mutation={flow.verifyOtpMutation}
          resendOtpMutation={flow.resendOtpMutation}
        />
      )}

      {flow.step === 'reset' && <ResetPasswordStep mutation={flow.resetPasswordMutation} />}
    </div>
  );
};

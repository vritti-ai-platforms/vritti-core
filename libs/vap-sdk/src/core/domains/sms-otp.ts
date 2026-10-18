import type { ApolloClient } from '@apollo/client';
import { SEND_SMS_OTP, VERIFY_SMS_OTP } from '../graphql/otp.js';
import { requireData, run } from '../transport/errors.js';
import type { RequestContext, SendOtpResult } from '../types.js';

// Codes over SMS — core's `sms-otps` domain, and nothing else.
export function createSmsOtpOperations(client: ApolloClient, context: RequestContext = {}) {
  const requestContext = { requestContext: context };

  return {
    // Sends a code to a phone number.
    send(phone: string): Promise<SendOtpResult> {
      return run(() =>
        client
          .mutate({
            mutation: SEND_SMS_OTP,
            variables: { input: { recipient: phone } },
            context: requestContext,
          })
          .then((r) => requireData(r.data).sendSmsOtp as SendOtpResult),
      );
    },

    // Whether a code holds, and nothing more.
    verify(phone: string, code: string): Promise<boolean> {
      return run(() =>
        client
          .mutate({
            mutation: VERIFY_SMS_OTP,
            variables: { input: { recipient: phone, code } },
            context: requestContext,
          })
          .then((r) => Boolean(requireData(r.data).verifySmsOtp?.verified)),
      );
    },
  };
}

export type SmsOtpOperations = ReturnType<typeof createSmsOtpOperations>;

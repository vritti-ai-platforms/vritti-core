import type { ApolloClient } from '@apollo/client';
import { SEND_SMS_OTP, VERIFY_SMS_OTP } from '../graphql/otp';
import { requireData, run } from '../transport/errors';
import type { RequestContext, SendOtpResult } from '../types';

/**
 * Codes over SMS — core's `sms-otps` domain, and nothing else.
 *
 * The `whatsappOtp` sibling, through the credential's configured SMS provider instead of its WABA.
 * Same two operations, same shapes; see that module for why neither resolves the party.
 */
export function createSmsOtpOperations(client: ApolloClient, context: RequestContext = {}) {
  const requestContext = { requestContext: context };

  return {
    /**
     * Sends a code to a phone number.
     *
     * **Every call spends money** — a billable message on the organization's provider account. Core
     * refuses a resend inside the credential's cooldown and returns `resendAvailableAt` so a caller
     * can show the wait rather than discovering it as an error.
     */
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

    /** Whether a code holds, and nothing more. Every failure mode reads identically. */
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

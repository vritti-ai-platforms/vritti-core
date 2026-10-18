import type { ApolloClient } from '@apollo/client';
import { SEND_WHATSAPP_OTP, VERIFY_WHATSAPP_OTP } from '../graphql/otp.js';
import { requireData, run } from '../transport/errors.js';
import type { RequestContext, SendOtpResult } from '../types.js';

// Codes over WhatsApp — core's `whatsapp-otps` domain, and nothing else.
export function createWhatsappOtpOperations(client: ApolloClient, context: RequestContext = {}) {
  const requestContext = { requestContext: context };

  return {
    // Sends a code to a phone number.
    send(phone: string): Promise<SendOtpResult> {
      return run(() =>
        client
          .mutate({
            mutation: SEND_WHATSAPP_OTP,
            variables: { input: { recipient: phone } },
            context: requestContext,
          })
          .then((r) => requireData(r.data).sendWhatsappOtp as SendOtpResult),
      );
    },

    // Whether a code holds, and nothing more.
    verify(phone: string, code: string): Promise<boolean> {
      return run(() =>
        client
          .mutate({
            mutation: VERIFY_WHATSAPP_OTP,
            variables: { input: { recipient: phone, code } },
            context: requestContext,
          })
          .then((r) => Boolean(requireData(r.data).verifyWhatsappOtp?.verified)),
      );
    },
  };
}

export type WhatsappOtpOperations = ReturnType<typeof createWhatsappOtpOperations>;

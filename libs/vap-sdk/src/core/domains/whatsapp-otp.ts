import type { ApolloClient } from '@apollo/client';
import { SEND_WHATSAPP_OTP, VERIFY_WHATSAPP_OTP } from '../graphql/otp';
import { requireData, run } from '../transport/errors';
import type { RequestContext, SendOtpResult } from '../types';

/**
 * Codes over WhatsApp — core's `whatsapp-otps` domain, and nothing else.
 *
 * Deliberately primitive: send, and ask whether a code holds. It does **not** answer "and who is
 * this?", because that spans this domain and `people`, and composing two domains is what
 * `flows/auth` is for. Keeping it out of here is what stops the party-matching rule existing in two
 * places — see `resolveParty`.
 *
 * Mirrors `smsOtp` exactly. One module per core domain, matching core's own split and its separate
 * `whatsapp-otps.send` / `.verify` permissions.
 */
export function createWhatsappOtpOperations(client: ApolloClient, context: RequestContext = {}) {
  const requestContext = { requestContext: context };

  return {
    /**
     * Sends a code to a phone number.
     *
     * **Every call spends money** — a billable WhatsApp message on the organization's account. Core
     * refuses a resend inside the credential's cooldown and returns `resendAvailableAt` so a caller
     * can show the wait rather than discovering it as an error.
     */
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

    /**
     * Whether a code holds, and nothing more.
     *
     * Every failure mode — wrong, expired, too many attempts, none outstanding — comes back as
     * `false` alone, so the result cannot be read as an oracle for which numbers have codes in
     * flight.
     *
     * A code is single-use: core marks the row verified and will not accept it again, so a caller
     * must carry the fact that verification happened rather than re-verifying at a later step.
     */
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

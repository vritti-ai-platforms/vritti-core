import type { ApolloClient } from '@apollo/client';
import { VapError } from '../errors';
import { requireData, run } from '../transport/errors';
import { SEND_WHATSAPP_OTP, VERIFY_WHATSAPP_OTP } from '../graphql/otp';
import { PEOPLE_BY_COMMUNICATION_QUERY } from '../graphql/people';
import { CHANNELS } from './people';
import type { RequestContext } from '../types';

/**
 * How a code reaches someone.
 *
 * `sms` is declared before it works, deliberately: core will gain `sendSmsOtp`/`verifySmsOtp`, and
 * having the dimension present from the start means the storefront, the sealed flow state and this
 * SDK all carry it already — adding SMS becomes wiring rather than reshaping. Until then it fails
 * loudly rather than quietly falling back to WhatsApp and charging for the wrong thing.
 */
export const OTP_CHANNELS = { WHATSAPP: 'whatsapp', SMS: 'sms' } as const;

export type OtpChannel = (typeof OTP_CHANNELS)[keyof typeof OTP_CHANNELS];

export type SendOtpResult = {
  sent: boolean;
  /** When the code stops being accepted. */
  expiresAt: string;
  /** The earliest a resend will be allowed. Core enforces it; this is for the countdown. */
  resendAvailableAt: string;
};

export type VerifyOtpResult = {
  verified: boolean;
  /** The matched person's display name, so a returning shopper can be greeted without a second call. */
  displayName: string | null;
  /**
   * The party already reachable at this number, or null when nobody is — the caller's signal to
   * collect a name and create one.
   *
   * Resolved only after `verified` is true, for a number the caller has just proven they control, so
   * it discloses nothing to somebody guessing phone numbers. Null while `verified` is false, always:
   * no lookup runs on a failed code.
   */
  partyId: string | null;
};


/**
 * Signing a shopper in with a phone number and a code sent over WhatsApp.
 *
 * Two operations, because that is what the browser does: ask for a code, then present it. Core keeps
 * them primitive — it will tell you a code was correct and nothing more — so the second half of
 * "and who is this?" is composed here, in the one place every storefront shares, rather than in each
 * app's own approximation of it.
 */
export function createOtpOperations(client: ApolloClient, context: RequestContext = {}) {
  const requestContext = { requestContext: context };

  return {
    /**
     * Sends a code to a phone number.
     *
     * **Every call spends money** — a billable WhatsApp message on the organization's account. Core
     * refuses a resend inside the credential's cooldown and returns `resendAvailableAt` so a caller
     * can show the wait rather than discovering it as an error.
     */
    send(phone: string, channel: OtpChannel = OTP_CHANNELS.WHATSAPP): Promise<SendOtpResult> {
      assertSupported(channel);
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
     * Checks a code and, if it holds, says who the number belongs to.
     *
     * ```ts
     * const { verified, partyId } = await sdk.otp.verify(phone, code);
     * if (!verified) return wrongCode();
     * if (partyId) return signIn(partyId);          // returning shopper
     * return askForName();                          // new — then sdk.people.create
     * ```
     *
     * The lookup is a **second call, made only on success**, and the ordering is the security
     * property: core answers every failed code identically, so nothing here distinguishes a wrong
     * code from an expired one from a number with no code outstanding. Somebody enumerating phone
     * numbers gets `{ verified: false, partyId: null }` every time.
     *
     * A code is single-use — core marks the row verified and will not accept it again — so a caller
     * must carry the fact that verification happened, rather than re-verifying at a later step.
     *
     * Returns the oldest party when several share the number, matching how `register` resolves.
     * That is a real case: a household line, or a shop counter.
     */
    async verify(phone: string, code: string, channel: OtpChannel = OTP_CHANNELS.WHATSAPP): Promise<VerifyOtpResult> {
      assertSupported(channel);
      const { verified } = await run(() =>
        client
          .mutate({
            mutation: VERIFY_WHATSAPP_OTP,
            variables: { input: { recipient: phone, code } },
            context: requestContext,
          })
          .then((r) => requireData(r.data).verifyWhatsappOtp),
      );

      if (!verified) return { verified: false, partyId: null, displayName: null };

      const parties = await run(() =>
        client
          .query({
            query: PEOPLE_BY_COMMUNICATION_QUERY,
            variables: { input: { channel: CHANNELS.PHONE, value: phone } },
            context: requestContext,
          })
          .then((r) => requireData(r.data).peopleByCommunication),
      );

      const match = parties[0];
      return { verified: true, partyId: match?.id ?? null, displayName: match?.displayName ?? null };
    },
  };
}

export type OtpOperations = ReturnType<typeof createOtpOperations>;

/**
 * Refuses a channel core cannot serve yet.
 *
 * Throws rather than falling back to WhatsApp: a shopper who chose SMS and silently received a
 * WhatsApp message would look at an empty inbox, and the organization would still be billed.
 */
function assertSupported(channel: OtpChannel): void {
  if (channel !== OTP_CHANNELS.WHATSAPP) {
    throw new VapError(`Sending a code over ${channel} is not available yet.`, 'Channel Unavailable', 501);
  }
}

import { type OtpChannel, type OtpStep, stepFromFlow } from '@vritti/vap-sdk';
import { open, type SealedOtpFlow } from '@vritti/vap-sdk/payload';
import { cookies } from 'next/headers';
import { resolvePayload, vapNextConfig } from './payload-adapter.js';

export type { OtpStep, SealedOtpFlow };
export { stepFromFlow };

/**
 * Used only when a sealed flow predates `codeLength` — see `currentOtpCode`.
 *
 * Not a general default: core's credential config decides the real length, and anything that reads
 * this constant instead is drawing boxes for a code it has not been told the shape of.
 */
const ASSUMED_CODE_LENGTH = 6;

/**
 * Reading the in-progress sign-in, for the page that renders the form.
 *
 * "Flow" here means the *state* — the sealed record of which number a code went to and whether it
 * was verified. That is a different thing from `core/flows/`, which is the layer holding the
 * multi-step sequences themselves; this file only reads what one of them parked. Named `otp-flow`
 * rather than `flow` so the two do not read as siblings.
 *
 * Deliberately **not** in the `'use server'` module beside it: every export of one of those becomes
 * a callable endpoint, and the flow state carries the proof that a number was verified. It is read
 * by a server component, which needs an ordinary function.
 *
 * The cookie's name and the signing secret stay in here. A page asking "which step am I on" should
 * not have to know either, nor to hold the unsealing right way round — that was three imports and
 * two pieces of SDK trivia at every call site.
 */
export async function currentOtpFlow(): Promise<SealedOtpFlow | null> {
  const payload = await resolvePayload();
  const config = vapNextConfig(payload);
  const name = config.cookieName ?? 'vap-otp';
  return open<SealedOtpFlow>((await cookies()).get(name)?.value, payload.secret);
}

/**
 * Which form to render: the phone step, the code step, or the name step.
 *
 * A total function of the sealed state, which is why there is no `?step=` in the URL — see
 * `stepFromFlow`. Use `currentOtpFlow` instead when the page also needs the number or the channel.
 */
export async function currentOtpStep(): Promise<OtpStep> {
  return stepFromFlow(await currentOtpFlow());
}

/** Everything the code step needs to draw itself, as core described the code it actually sent. */
export type OtpCodeState = {
  /** How many digits to collect. Core's per-credential config, 4 to 10. */
  length: number;
  /** Epoch ms the code stops being accepted, or 0 when the flow never recorded one. */
  expiresAt: number;
  /** Epoch ms a resend becomes allowed. */
  resendAt: number;
  /**
   * Whole seconds until the code expires, floored at 0.
   *
   * Computed here so the server's first paint is right and a client countdown can start from it
   * without a hydration mismatch — the timer must render the same string on both sides, then begin
   * ticking after mount.
   */
  secondsRemaining: number;
  /** Whole seconds until a resend is allowed, floored at 0. */
  resendInSeconds: number;
  /** Which route the code took, so the copy can name it. */
  channel: OtpChannel;
  /** The number it went to, for echoing back. */
  phone: string;
};

/**
 * The code in flight, or null when no sign-in is waiting on one.
 *
 * The companion to `currentOtpFlow` for the code step specifically: that returns the raw sealed
 * record, this answers the two questions a form actually has — how many boxes, and how long left.
 * Both come from core on the send and are sealed into the flow, so this costs no round trip and
 * cannot disagree with the code the party is holding.
 *
 * Null on the phone and name steps too, not just when there is no flow: there is no code to
 * describe at either, and returning a zeroed shape would make every caller check it anyway.
 *
 * The expiry is **advisory**. Core decides what it still accepts; a countdown at zero is a prompt
 * to ask for another code, never the thing that refuses one.
 */
export async function currentOtpCode(): Promise<OtpCodeState | null> {
  const flow = await currentOtpFlow();
  if (!flow || stepFromFlow(flow) !== 'code') return null;

  // A flow sealed before these fields existed still has to render. Falling back on the length keeps
  // the form usable; leaving the expiry at 0 hides the timer rather than counting down to 1970.
  const expiresAt = flow.codeExpiresAt ?? 0;
  const remaining = (at: number) => (at ? Math.max(0, Math.ceil((at - Date.now()) / 1000)) : 0);

  return {
    length: flow.codeLength ?? ASSUMED_CODE_LENGTH,
    expiresAt,
    resendAt: flow.resendAt,
    secondsRemaining: remaining(expiresAt),
    resendInSeconds: remaining(flow.resendAt),
    channel: flow.channel,
    phone: flow.phone,
  };
}

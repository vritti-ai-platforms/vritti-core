import { type OtpChannel, type OtpStep, stepFromFlow } from '@vritti/vap-sdk';
import { open, type SealedOtpFlow } from '@vritti/vap-sdk/payload';
import { cookies } from 'next/headers';
import { resolvePayload, vapNextConfig } from './payload-adapter.js';

export type { OtpStep, SealedOtpFlow };
export { stepFromFlow };

const ASSUMED_CODE_LENGTH = 6;

// Reading the in-progress sign-in, for the page that renders the form. "Flow" here means the *state* — the sealed
// record of which number a code went to and whether it was verified.
export async function currentOtpFlow(): Promise<SealedOtpFlow | null> {
  const payload = await resolvePayload();
  const config = vapNextConfig(payload);
  const name = config.cookieName ?? 'vap-otp';
  return open<SealedOtpFlow>((await cookies()).get(name)?.value, payload.secret);
}

// Which form to render: the phone step, the code step, or the name step.
export async function currentOtpStep(): Promise<OtpStep> {
  return stepFromFlow(await currentOtpFlow());
}

export type OtpCodeState = {
  length: number;
  expiresAt: number;
  resendAt: number;
  secondsRemaining: number;
  resendInSeconds: number;
  channel: OtpChannel;
  phone: string;
};

// The code in flight, or null when no sign-in is waiting on one.
export async function currentOtpCode(): Promise<OtpCodeState | null> {
  const flow = await currentOtpFlow();
  if (!flow || stepFromFlow(flow) !== 'code') return null;

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

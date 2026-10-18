'use server';

import { createOtpSignInActions, type OtpActionState } from '@vritti/vap-sdk/payload';
import { getCurrentParty } from './party.js';
import { resolvePayload, vapNextConfig, vapNextMessages } from './payload-adapter.js';
import { nextOtpPorts } from './ports.js';
import { linkVisitorSession } from './visitor-session.js';

// Sign-in, as server actions a storefront imports directly.

const actions = async () => {
  const payload = await resolvePayload();
  const config = vapNextConfig(payload);

  return createOtpSignInActions({
    payload,
    ports: nextOtpPorts(),
    routes: config.routes,
    ...(config.cookieName ? { cookieName: config.cookieName } : {}),
    ...(config.collection ? { collection: config.collection } : {}),
    messages: () => vapNextMessages(payload, config.messagesGlobal),
    onError: (error, context) =>
      (payload as { logger?: { error: (...a: unknown[]) => void } }).logger?.error(
        { err: error, context },
        'OTP sign-in failed',
      ),
  });
};

// Step one — send a code to the number on the form.
export async function requestOtpAction(previous: OtpActionState, formData: FormData): Promise<OtpActionState> {
  return (await actions()).request(previous, formData);
}

// Step two — check the code, and sign in whoever the number already belongs to.
export async function verifyOtpAction(previous: OtpActionState, formData: FormData): Promise<OtpActionState> {
  const state = await (await actions()).verify(previous, formData);
  await carryVisitorSession();
  return state;
}

// Step three — name a first-time party, then sign them in.
export async function completeOtpAction(previous: OtpActionState, formData: FormData): Promise<OtpActionState> {
  const state = await (await actions()).complete(previous, formData);
  await carryVisitorSession();
  return state;
}

// Links the visitor's session to whoever just signed in, so the store they were browsing stays theirs.
async function carryVisitorSession(): Promise<void> {
  try {
    const payload = await resolvePayload();
    const party = await getCurrentParty();
    await linkVisitorSession(payload, party?.partyId ?? null);
  } catch {
    // Deliberately silent — see above.
  }
}

// Abandons the flow, so a mistyped number is one click to fix.
export async function restartOtpAction(): Promise<void> {
  await (await actions()).restart();
}

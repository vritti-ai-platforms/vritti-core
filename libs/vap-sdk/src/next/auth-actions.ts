'use server';

import { createOtpSignInActions, type OtpActionState } from '@vritti/vap-sdk/payload';
import { nextOtpPorts } from './ports.js';
import { resolvePayload, vapNextConfig, vapNextMessages } from './payload-adapter.js';

/**
 * Sign-in, as server actions a storefront imports directly.
 *
 * The directive has to be here, in the module that defines them: Next's SWC transform only runs on
 * files that carry it, and the CommonJS the rest of this package emits puts `"use strict"` first,
 * where the transform never sees it. Hence this tier's own ESM build.
 *
 * Nothing is configured per call. The app's routes, cookie name and message global come from
 * `vap({ auth })` in its Payload config, read through the running instance — so a storefront adds
 * four lines to one config file and imports these, rather than writing the flow.
 */

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

/** Step one — send a code to the number on the form. */
export async function requestOtpAction(
  previous: OtpActionState,
  formData: FormData,
): Promise<OtpActionState> {
  return (await actions()).request(previous, formData);
}

/** Step two — check the code, and sign in whoever the number already belongs to. */
export async function verifyOtpAction(
  previous: OtpActionState,
  formData: FormData,
): Promise<OtpActionState> {
  return (await actions()).verify(previous, formData);
}

/** Step three — name a first-time party, then sign them in. */
export async function completeOtpAction(
  previous: OtpActionState,
  formData: FormData,
): Promise<OtpActionState> {
  return (await actions()).complete(previous, formData);
}

/** Abandons the flow, so a mistyped number is one click to fix. */
export async function restartOtpAction(): Promise<void> {
  await (await actions()).restart();
}

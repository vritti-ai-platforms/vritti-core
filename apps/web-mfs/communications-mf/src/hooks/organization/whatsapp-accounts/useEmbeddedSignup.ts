import { toast } from '@vritti/quantum-ui/Sonner';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ConnectEmbeddedSignupData,
  EmbeddedSignupConfigData,
  EmbeddedSignupEventName,
} from '@/schemas/whatsapp-accounts';
import { type FacebookSdk, loadFacebookSdk } from '@/utils/facebook-sdk';

// Only Facebook may drive a connect: without an origin check any framed page could post a
// signup-shaped message and choose which WABA id the browser submits. Meta's own sample accepts any
// facebook.com host, and the popup is served from several of them (www, web, business, locale
// subdomains) — an exact two-host allowlist silently drops the message and the flow never completes.
// Matched on the parsed hostname rather than with endsWith on the origin string, so a lookalike
// domain ending in "facebook.com" cannot satisfy it.
function isFacebookOrigin(origin: string): boolean {
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === 'https:' && (hostname === 'facebook.com' || hostname.endsWith('.facebook.com'));
  } catch {
    return false;
  }
}

/**
 * Turns on session logging, which is what makes Meta post the message carrying the WABA id back to
 * us. `3` is the only value Meta accepts.
 *
 * Not optional for this integration, for two documented reasons: with no `version` key in `extras`
 * this is the v2 flow, where partners are *required* to send it to receive the callback at all; and
 * coexistence lists "Embedded Signup with session logging" among its own requirements, so removing
 * it disables the very flow the second button exists for. Meta's coexistence payload sample shows
 * the resulting `version: 3` on the message.
 */
const SESSION_INFO_VERSION = '3';

const SIGNUP_MESSAGE_TYPE = 'WA_EMBEDDED_SIGNUP';

const FINISH_EVENTS: EmbeddedSignupEventName[] = [
  'FINISH',
  'FINISH_ONLY_WABA',
  'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING',
  'FINISH_OBO_MIGRATION',
  'FINISH_GRANT_ONLY_API_ACCESS',
];

// How long to keep waiting for the postMessage half after the login callback has already returned a
// code. The two normally land within a tick of each other; this only covers one never arriving.
const SETTLE_TIMEOUT_MS = 8000;

interface EmbeddedSignupMessage {
  type?: string;
  event?: string;
  data?: {
    waba_id?: string;
    phone_number_id?: string;
    // The customer's business portfolio. Taking it from here beats deriving it server-side from the
    // WABA's owner_business_info, which needs business_management advanced access to come back.
    business_id?: string;
    current_step?: string;
    // Present when the customer used the flow's own error reporter, which arrives as a CANCEL
    error_message?: string;
    error_code?: string;
    session_id?: string;
  };
}

interface SignupPayload {
  wabaId: string;
  // Absent on the coexistence finish, whose payload carries only waba_id, and on FINISH_ONLY_WABA.
  // Nothing downstream needs it — numbers are read live from Meta.
  phoneNumberId?: string;
  businessId?: string;
  event: EmbeddedSignupEventName;
}

/**
 * Opts this call into WhatsApp Business app onboarding ("coexistence") — connecting a number already
 * live on the WhatsApp Business app, which the default flow refuses as "Ineligible" because a number
 * can only belong to one WABA.
 *
 * Needs BOTH halves of Meta's setup: the app-wide capability (App Dashboard > WhatsApp >
 * Configuration, subscribe to `history`, `smb_app_state_sync` and `smb_message_echoes`) AND this
 * per-call flag. The flag alone silently yields the default flow.
 *
 * Client-side only — never sent to our own server, which learns which path ran from the terminal
 * event (`FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING`) instead.
 *
 * Both values are documented for the v2 flow (the one selected by omitting `version`) and Meta's
 * versions table describes each as enabling WhatsApp Business App phone number onboarding:
 *   `whatsapp_business_app_onboarding` — the value v3 and v4 also name; the current default here.
 *   `only_waba_sharing`               — v2 only, and "will NOT show the new consolidated UI".
 * If the first produces no change, swapping to the second is the only remaining code-side variable;
 * everything else about coexistence is app-level enablement (the three webhook subscriptions) and
 * Solution Partner / Tech Provider status.
 */
export type EmbeddedSignupFeatureType = 'whatsapp_business_app_onboarding' | 'only_waba_sharing';

interface UseEmbeddedSignupOptions {
  config: EmbeddedSignupConfigData | undefined;
  onComplete: (result: ConnectEmbeddedSignupData) => void;
  featureType?: EmbeddedSignupFeatureType;
}

function parseMessage(data: unknown): EmbeddedSignupMessage | null {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as EmbeddedSignupMessage;
    } catch {
      return null;
    }
  }
  // Some SDK builds post the object directly rather than a JSON string
  return typeof data === 'object' && data !== null ? (data as EmbeddedSignupMessage) : null;
}

/**
 * Runs Meta's Embedded Signup popup and hands back a complete connect payload.
 *
 * The flow reports itself through two independent channels that can land in either order — the
 * `FB.login` callback carries the OAuth code, a `postMessage` carries the WABA id — and neither half
 * is usable alone. So both are collected and whichever completes the pair fires `onComplete`.
 */
export function useEmbeddedSignup({ config, onComplete, featureType }: UseEmbeddedSignupOptions) {
  const [isOpening, setIsOpening] = useState(false);

  // A popup still open when the page navigates away would otherwise leak its listener and timer
  const teardownRef = useRef<(() => void) | null>(null);
  useEffect(() => () => teardownRef.current?.(), []);

  const open = useCallback(async () => {
    if (!config?.enabled || !config.configId) return;

    setIsOpening(true);

    let sdk: FacebookSdk;
    try {
      sdk = await loadFacebookSdk(config.appId, config.graphVersion);
    } catch (error) {
      setIsOpening(false);
      toast.error(error instanceof Error ? error.message : 'Could not load the Facebook SDK.');
      return;
    }

    let signup: SignupPayload | null = null;
    let code: string | null = null;
    let done = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function onMessage(event: MessageEvent) {
      if (!isFacebookOrigin(event.origin)) return;

      const message = parseMessage(event.data);
      if (message?.type !== SIGNUP_MESSAGE_TYPE) return;

      if (message.event === 'CANCEL') {
        // A CANCEL carrying error_message is the customer using the flow's own error reporter, not a
        // plain back-out. Surfacing Meta's text is the only way they learn what went wrong, and the
        // error code and session id are what Meta asks for in a support request.
        const reported = message.data?.error_message;
        teardown();
        if (reported) {
          console.error('[whatsapp-embedded-signup] reported by Meta', {
            code: message.data?.error_code,
            sessionId: message.data?.session_id,
          });
          toast.error(reported);
        }
        return;
      }

      const finished = FINISH_EVENTS.find((candidate) => candidate === message.event);
      if (!finished || !message.data?.waba_id) return;

      signup = {
        wabaId: message.data.waba_id,
        phoneNumberId: message.data.phone_number_id,
        businessId: message.data.business_id,
        event: finished,
      };
      tryComplete();
    }

    const teardown = () => {
      if (done) return;
      done = true;
      window.removeEventListener('message', onMessage);
      if (timer) clearTimeout(timer);
      teardownRef.current = null;
      setIsOpening(false);
    };

    const tryComplete = () => {
      if (done || !signup || !code) return;
      const result: ConnectEmbeddedSignupData = {
        code,
        wabaId: signup.wabaId,
        phoneNumberId: signup.phoneNumberId,
        businessId: signup.businessId,
        event: signup.event,
      };
      teardown();
      onComplete(result);
    };

    window.addEventListener('message', onMessage);
    teardownRef.current = teardown;

    sdk.login(
      (response) => {
        const returned = response.authResponse?.code;

        // No code means the window was closed or the grant declined — silent, like CANCEL
        if (!returned) {
          teardown();
          return;
        }

        code = returned;
        tryComplete();

        if (done) return;

        // The code is single-use and short-lived, so there is nothing to salvage if its other half
        // never turns up; say so plainly rather than leaving a spinner running
        timer = setTimeout(() => {
          if (done) return;
          teardown();
          toast.error('WhatsApp setup did not finish. Please try connecting again.');
        }, SETTLE_TIMEOUT_MS);
      },
      {
        config_id: config.configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          // Empty, and correctly so: `setup` carries a `solutionID` only for Solution Partners, and
          // Vritti is an independent Tech Provider with no solution. Meta's Tech Provider sample
          // sends exactly `setup: {}`.
          setup: {},
          sessionInfoVersion: SESSION_INFO_VERSION,
          // Blank enables the default flow, so the key is omitted rather than sent empty
          ...(featureType ? { featureType } : {}),
        },
      },
    );
  }, [config, onComplete, featureType]);

  return { open, isOpening };
}

import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@vritti/quantum-ui/Sonner';
import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  EMBEDDED_SIGNUP_MESSAGE_PARAM,
  EMBEDDED_SIGNUP_RELAY_MESSAGE,
  EMBEDDED_SIGNUP_RESULT_PARAM,
  type EmbeddedSignupRelayMessage,
} from '@/schemas/whatsapp-accounts';
import { WHATSAPP_ACCOUNTS_KEY } from './keys';

/**
 * Handles the end of a signup, on whichever window it lands in.
 *
 * The popup finishes the round trip on this same page — the callback redirects it back to the URL it
 * started from — so this hook runs in two roles:
 *
 * - **In the popup**: hands the outcome to the window that opened it, then closes. Nothing is shown,
 *   because the operator is not looking at this window.
 * - **In the console**: reports the outcome and refreshes. Reached either by relay from the popup, or
 *   directly off the query string when there is no opener — which covers a blocked popup, a
 *   same-tab fallback, or someone opening the returned link on its own.
 *
 * Doing the closing here rather than in a server-rendered page is what keeps the flow free of any
 * HTML of ours: this is bundled application code, in the app whose window it is closing.
 */
export function useEmbeddedSignupResult() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // The effect re-runs when the params change, and clearing them is itself such a change — this
  // keeps the toast to exactly one per return
  const handled = useRef(false);

  const result = searchParams.get(EMBEDDED_SIGNUP_RESULT_PARAM);
  const message = searchParams.get(EMBEDDED_SIGNUP_MESSAGE_PARAM);

  const report = useCallback(
    (ok: boolean, text: string | null) => {
      if (ok) {
        toast.success(text ?? 'WhatsApp account connected.');
        // The whole prefix: a new credential revalidates the live Meta reads (phone numbers,
        // templates) as well as the account row itself
        queryClient.invalidateQueries({ queryKey: WHATSAPP_ACCOUNTS_KEY });
      } else {
        toast.error(text ?? 'WhatsApp setup could not be completed.');
      }
    },
    [queryClient],
  );

  // The console's channel: the popup relays its outcome here just before closing. Same-origin, since
  // both windows are this app on this host.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;

      const relayed = event.data as EmbeddedSignupRelayMessage | undefined;
      if (relayed?.type !== EMBEDDED_SIGNUP_RELAY_MESSAGE) return;

      report(relayed.ok, relayed.message ?? null);
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [report]);

  useEffect(() => {
    if (!result || handled.current) return;
    handled.current = true;

    const ok = result === 'connected';

    // In the popup: relay and get out of the way. Same-origin, so the target is this very origin.
    const opener = window.opener as Window | null;
    if (opener && !opener.closed) {
      const relay: EmbeddedSignupRelayMessage = {
        type: EMBEDDED_SIGNUP_RELAY_MESSAGE,
        ok,
        message: message ?? undefined,
      };
      try {
        opener.postMessage(relay, window.location.origin);
        window.close();
        return;
      } catch {
        // Fall through and report here — better a message in the wrong window than none at all
      }
    }

    report(ok, message);

    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete(EMBEDDED_SIGNUP_RESULT_PARAM);
        next.delete(EMBEDDED_SIGNUP_MESSAGE_PARAM);
        return next;
      },
      { replace: true },
    );
  }, [result, message, report, setSearchParams]);
}

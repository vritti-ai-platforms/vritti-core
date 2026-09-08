import { toast } from '@vritti/quantum-ui/Sonner';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EmbeddedSignupConfigData } from '@/schemas/whatsapp-accounts';
import {
  createWhatsappConnectState,
  createWhatsappReconnectState,
} from '@/services/organization/whatsapp-accounts.service';

// Named so a second click reuses the same window instead of stacking popups
const POPUP_NAME = 'vritti-whatsapp-connect';
// `noopener` must not appear at all — some browsers honour the token whatever its value and sever
// window.opener, which is the channel the popup reports back on
const POPUP_FEATURES = 'popup=yes,width=700,height=820';

// How often to notice the operator closed the window without finishing. Only releases the button.
const CLOSE_POLL_MS = 700;

interface UseEmbeddedSignupOptions {
  config: EmbeddedSignupConfigData | undefined;
  // 'reconnect' requires accountId; the account is bound into the signed state, not sent by Meta
  mode: 'connect' | 'reconnect';
  accountId?: string;
}

/**
 * Runs WhatsApp Embedded Signup in a popup.
 *
 * The flow cannot run on this origin: Meta matches the OAuth redirect URI exactly, that list rejects
 * wildcards, and `organizations.subdomain` gains an entry with every signup — so the whole round trip
 * is served from one shared origin. This hook authorises an attempt, gets the signed URL, and points
 * a popup at it.
 *
 * The popup finishes by landing back on this app (the callback redirects it to the URL it started
 * from), where `useEmbeddedSignupResult` hands the outcome to this window and closes it — so this
 * hook only opens the window, and knows nothing about how it ends. Nothing sensitive crosses back:
 * the authorization code is exchanged server-side and never reaches a browser.
 */
export function useEmbeddedSignup({ config, mode, accountId }: UseEmbeddedSignupOptions) {
  const [isRunning, setIsRunning] = useState(false);

  // A popup still open when the page navigates away would otherwise leak its poller
  const teardownRef = useRef<(() => void) | null>(null);
  useEffect(() => () => teardownRef.current?.(), []);

  const open = useCallback(async () => {
    if (!config?.enabled || isRunning) return;

    /**
     * Opened before the mint, blank, then pointed somewhere once the URL is known.
     *
     * `window.open` after an `await` has lost the click that justified it, and Safari blocks it
     * outright — so the window is claimed synchronously.
     */
    const popup = window.open('', POPUP_NAME, POPUP_FEATURES);
    if (!popup) {
      toast.error('Allow pop-ups for this site to connect WhatsApp.');
      return;
    }

    setIsRunning(true);

    let poller: ReturnType<typeof setInterval> | null = null;
    const teardown = () => {
      if (poller) clearInterval(poller);
      poller = null;
      teardownRef.current = null;
      setIsRunning(false);
    };

    try {
      // Where the popup comes back to — this exact page, minus any result params left by a previous
      // attempt. The relay reads them there and closes the window.
      const returnUrl = new URL(window.location.href);
      returnUrl.search = '';

      const { url } =
        mode === 'reconnect' && accountId
          ? await createWhatsappReconnectState(accountId, { returnUrl: returnUrl.toString() })
          : await createWhatsappConnectState({ returnUrl: returnUrl.toString() });

      // The operator may have closed the blank window while the mint was in flight
      if (popup.closed) {
        teardown();
        return;
      }

      popup.location.href = url;
      teardownRef.current = teardown;

      // Closing the window is a silent give-up — it only needs to stop the button spinning
      poller = setInterval(() => {
        if (popup.closed) teardown();
      }, CLOSE_POLL_MS);
    } catch {
      // The axios interceptor already surfaced the failure; this just undoes the optimism
      popup.close();
      teardown();
    }
  }, [config, isRunning, mode, accountId]);

  return { open, isRunning };
}

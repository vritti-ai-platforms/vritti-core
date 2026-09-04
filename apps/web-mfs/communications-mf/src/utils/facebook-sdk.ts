// Facebook JS SDK loader for WhatsApp Embedded Signup.
//
// `window.FB` is a global singleton and RemoteRoutes can mount this remote more than once, so
// loading has to be idempotent on both axes: an already-initialised SDK resolves immediately, a
// concurrent request shares the one in-flight promise, and an existing <script> is reused rather
// than injected twice.

const SDK_SRC = 'https://connect.facebook.net/en_US/sdk.js';
const SCRIPT_ID = 'facebook-jssdk';

export interface FacebookLoginResponse {
  status?: string;
  authResponse?: { code?: string } | null;
}

export interface FacebookSdk {
  init(options: { appId: string; version: string; autoLogAppEvents?: boolean; xfbml?: boolean }): void;
  login(callback: (response: FacebookLoginResponse) => void, options: Record<string, unknown>): void;
}

declare global {
  interface Window {
    FB?: FacebookSdk;
    // The SDK invokes this once it is ready. Meta's documented initialisation hook, and more
    // reliable than a load listener: it fires after window.FB is actually assigned.
    fbAsyncInit?: () => void;
  }
}

let pending: Promise<FacebookSdk> | null = null;

export function loadFacebookSdk(appId: string, version: string): Promise<FacebookSdk> {
  if (window.FB) return Promise.resolve(window.FB);
  if (pending) return pending;

  pending = new Promise<FacebookSdk>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const script = existing ?? document.createElement('script');

    const onReady = () => {
      const sdk = window.FB;
      if (!sdk) {
        reject(new Error('The Facebook SDK loaded without exposing window.FB.'));
        return;
      }
      sdk.init({ appId, version, autoLogAppEvents: true, xfbml: true });
      resolve(sdk);
    };

    // Both paths, because either can be the one that happens: fbAsyncInit is the documented hook and
    // fires for a script this call injected, while a script another remote instance already injected
    // may have consumed it before this listener existed — in which case load still resolves us.
    window.fbAsyncInit = onReady;
    const onLoad = () => {
      if (window.FB) onReady();
    };

    const onError = () =>
      reject(new Error('Could not reach Facebook to load the sign-up SDK. A network block or ad blocker may be why.'));

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = SDK_SRC;
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  });

  // A failed load must not poison later attempts — the next click starts over
  pending.catch(() => {
    pending = null;
  });

  return pending;
}

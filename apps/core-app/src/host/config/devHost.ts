import { NativeModules, Platform } from 'react-native';

// The host that served this JS bundle. Metro sets scriptURL to the dev server it was fetched from
// (http://192.168.1.9:8081/index.bundle?… on a device, http://localhost:8081/… on a simulator), so
// it is by definition reachable from wherever the app is running — including after the LAN IP
// changes, which a bundle-time value cannot survive.
//
// In a release build scriptURL is a file:// URL with no host, so this returns undefined and the
// caller falls back to the production CDN.
function hostFromScriptUrl(): string | undefined {
  const scriptURL = (NativeModules.SourceCode?.getConstants?.() ?? NativeModules.SourceCode)?.scriptURL as
    | string
    | undefined;
  if (!scriptURL) return undefined;

  const match = /^https?:\/\/([^/:]+)/.exec(scriptURL);
  return match?.[1];
}

// Android emulators reach the host machine on 10.0.2.2, never on localhost — that address IS the
// bundle host, so it is kept as-is rather than rewritten.
export function resolveDevHost(configuredHost?: string): string | undefined {
  return hostFromScriptUrl() ?? configuredHost ?? (Platform.OS === 'ios' ? 'localhost' : '10.0.2.2');
}

import { setToastAdapter, type ToastAdapter } from '@vritti/quantum-ui-native/utils';

// Single app-wide toast surface. The axios interceptor in @vritti/quantum-ui-native already
// fires loading/success/error toasts through the adapter registered via `setToastAdapter`.
// Apollo operations bypass that interceptor, so `useGqlMutation` calls into THIS same adapter
// to keep one source of truth for both transports. The actual toast UI is registered once at
// app startup via `registerToastAdapter`; until then every call is a safe no-op.
let adapter: ToastAdapter | null = null;

// Wire the real toast UI here once (also forwards it to the axios interceptor so REST + GraphQL
// share the same adapter). Call this from the app shell when the toast UI mounts.
export function registerToastAdapter(toastAdapter: ToastAdapter): void {
  adapter = toastAdapter;
  setToastAdapter(toastAdapter);
}

// Read the registered adapter (or null). Consumers should guard with optional chaining.
export function getToastAdapter(): ToastAdapter | null {
  return adapter;
}

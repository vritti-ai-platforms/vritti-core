import { setToastAdapter, type ToastAdapter } from '@vritti/quantum-ui-native/utils';

// Single app-wide toast surface shared by the axios interceptor (REST) and useGqlMutation (GraphQL).
let adapter: ToastAdapter | null = null;

// Wire the real toast UI here once and forward it to the axios interceptor; call from the app shell.
export function registerToastAdapter(toastAdapter: ToastAdapter): void {
  adapter = toastAdapter;
  setToastAdapter(toastAdapter);
}

// Read the registered adapter (or null). Consumers should guard with optional chaining.
export function getToastAdapter(): ToastAdapter | null {
  return adapter;
}

import { createPreferences } from '@vritti/quantum-ui-native/utils';

// Non-secret app state — theme preference, selected BU, UI flags. The MMKV adapter
// factory lives in @vritti/quantum-ui-native so other RN apps reuse it; this app only
// owns the namespace + domain keys below. Secrets (auth tokens, deployment base URL)
// stay in the Keychain-backed `storage` adapter in quantum-ui-native.config.ts.
// `preferencesStorage` satisfies the async storage-adapter contract (ThemeProvider etc.);
// `preferences` is the raw MMKV instance for direct reads/writes.
export const { instance: preferences, storage: preferencesStorage } = createPreferences('vritti.preferences');

// --- Selected business unit -------------------------------------------------
// Persists the active BU across launches and is the single source the x-bu-id request
// header reads from. PermissionProvider keeps it in sync with the in-memory selection.
const SELECTED_BU_KEY = 'selectedBuId';

export function getSelectedBusinessUnitId(): string | null {
  return preferences.getString(SELECTED_BU_KEY) ?? null;
}

export function setSelectedBusinessUnitId(buId: string): void {
  preferences.set(SELECTED_BU_KEY, buId);
}

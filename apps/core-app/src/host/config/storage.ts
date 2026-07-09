import { createPreferences } from '@vritti/quantum-ui-native/utils';

export const { instance: preferences, storage: preferencesStorage } = createPreferences('vritti.preferences');

export const { instance: apolloCacheStore } = createPreferences('vritti.apollo-cache');

export const { instance: offlineQueueStore } = createPreferences('vritti.offline-queue');

const SELECTED_BU_KEY = 'selectedBuId';

export function getSelectedBusinessUnitId(): string | null {
  return preferences.getString(SELECTED_BU_KEY) ?? null;
}

export function setSelectedBusinessUnitId(buId: string): void {
  preferences.set(SELECTED_BU_KEY, buId);
}

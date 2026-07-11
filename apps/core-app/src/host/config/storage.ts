import { createPreferences } from '@vritti/quantum-ui-native/utils';

export const { instance: preferences, storage: preferencesStorage } = createPreferences('vritti.preferences');

export const { instance: apolloCacheStore } = createPreferences('vritti.apollo-cache');

export const { instance: offlineQueueStore } = createPreferences('vritti.offline-queue');

const SELECTED_SITE_KEY = 'selectedSiteId';

export function getSelectedSiteId(): string | null {
  return preferences.getString(SELECTED_SITE_KEY) ?? null;
}

export function setSelectedSiteId(siteId: string): void {
  preferences.set(SELECTED_SITE_KEY, siteId);
}

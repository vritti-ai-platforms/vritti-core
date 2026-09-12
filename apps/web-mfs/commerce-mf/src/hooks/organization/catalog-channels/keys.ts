export const CATALOG_CHANNELS_KEY = ['commerce', 'org', 'catalog-channels'] as const;
export const APP_CHANNEL_KEY = ['commerce', 'org', 'catalog-channels', 'app'] as const;
export const APP_CHANNEL_ITEMS_KEY = (channelId: string) =>
  ['commerce', 'org', 'catalog-channels', 'app', channelId, 'items'] as const;

export const CATALOG_CHANNELS_KEY = ['commerce', 'site', 'catalog-channels'] as const;
export const APP_CHANNEL_KEY = ['commerce', 'site', 'catalog-channels', 'app'] as const;
export const APP_CHANNEL_ITEMS_KEY = (channelId: string) =>
  ['commerce', 'site', 'catalog-channels', 'app', channelId, 'items'] as const;

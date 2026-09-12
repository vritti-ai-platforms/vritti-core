export const CATALOG_CHANNELS_KEY = ['commerce', 'le', 'catalog-channels'] as const;
export const APP_CHANNEL_KEY = ['commerce', 'le', 'catalog-channels', 'app'] as const;
export const APP_CHANNEL_ITEMS_KEY = (channelId: string) =>
  ['commerce', 'le', 'catalog-channels', 'app', channelId, 'items'] as const;

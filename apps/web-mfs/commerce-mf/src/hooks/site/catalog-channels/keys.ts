export const CATALOG_CHANNELS_KEY = ['commerce', 'site', 'catalog-channels'] as const;
export const CHANNEL_ITEMS_KEY = (channelId: string) =>
  ['commerce', 'site', 'catalog-channels', channelId, 'items'] as const;

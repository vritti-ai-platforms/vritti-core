export const CHANNELS_SCREEN_KEY = ['commerce', 'org', 'catalog-channels'] as const;
export const CHANNEL_ITEMS_KEY = (channelId: string) =>
  ['commerce', 'org', 'catalog-channels', channelId, 'items'] as const;

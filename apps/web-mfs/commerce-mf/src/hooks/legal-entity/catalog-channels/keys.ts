export const CHANNELS_SCREEN_KEY = ['commerce', 'le', 'catalog-channels'] as const;
export const CHANNEL_ITEMS_KEY = (channelId: string) =>
  ['commerce', 'le', 'catalog-channels', channelId, 'items'] as const;

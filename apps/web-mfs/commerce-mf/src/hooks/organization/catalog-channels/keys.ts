export const CATALOG_CHANNELS_KEY = ['commerce', 'org', 'catalog-channels'] as const;
export const CHANNEL_ITEMS_KEY = (channelId: string) =>
  ['commerce', 'org', 'catalog-channels', channelId, 'items'] as const;
export const CHANNEL_CURRENCIES_KEY = (channelId: string) =>
  ['commerce', 'org', 'catalog-channels', channelId, 'currencies'] as const;
export const CHANNEL_PRICES_KEY = (channelId: string, currencyCode: string) =>
  [...CHANNEL_CURRENCIES_KEY(channelId), currencyCode, 'prices'] as const;

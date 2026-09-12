export const CATALOG_CHANNELS_KEY = ['commerce', 'org', 'catalog-channels'] as const;
export const CATALOG_CHANNELS_TABLE_KEY = [...CATALOG_CHANNELS_KEY, 'table'] as const;
export const CATALOG_CHANNELS_FOR_CATALOG_KEY = (catalogId: string) =>
  [...CATALOG_CHANNELS_KEY, 'catalog', catalogId] as const;

export const CATALOGS_KEY = ['commerce', 'catalogs'] as const;
export const CATALOGS_TABLE_KEY = [...CATALOGS_KEY, 'table'] as const;
export const CATALOG_KEY = (id: string) => [...CATALOGS_KEY, id] as const;
export const CATALOG_CHANNELS_KEY = (catalogId: string) => [...CATALOGS_KEY, catalogId, 'channels'] as const;

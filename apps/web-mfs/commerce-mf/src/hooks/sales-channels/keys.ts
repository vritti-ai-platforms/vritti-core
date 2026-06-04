export const SALES_CHANNELS_KEY = ['commerce', 'sales-channels'] as const;
export const SALES_CHANNELS_TABLE_KEY = [...SALES_CHANNELS_KEY, 'table'] as const;
export const SALES_CHANNEL_KEY = (id: string) => [...SALES_CHANNELS_KEY, id] as const;

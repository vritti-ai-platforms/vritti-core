// Declared here rather than imported — the gateway forwards to commerce, it does not share its schema
export const CHANNEL_TYPES = ['APP', 'POS', 'B2B'] as const;

export type CatalogChannelTypeValue = (typeof CHANNEL_TYPES)[number];

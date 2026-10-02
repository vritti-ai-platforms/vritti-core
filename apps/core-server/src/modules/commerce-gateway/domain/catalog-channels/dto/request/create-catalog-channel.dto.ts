// Declared here rather than imported — the gateway forwards to commerce, it does not share its schema
export const CHANNEL_TYPES = ['APP', 'POS', 'B2B'] as const;

export type CatalogChannelTypeValue = (typeof CHANNEL_TYPES)[number];

export const CatalogChannelTypeValues = {
  APP: 'APP',
  POS: 'POS',
  B2B: 'B2B',
} as const satisfies Record<CatalogChannelTypeValue, CatalogChannelTypeValue>;

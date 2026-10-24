export const OFFERINGS_KEY = ['commerce', 'site', 'offerings'] as const;
export const SITE_OFFERINGS_TABLE_KEY = ['commerce', 'site', 'offerings', 'table'] as const;
export const SITE_OFFERING_VARIANTS_TABLE_KEY = (offeringId: string) =>
  ['commerce', 'site', 'offerings', offeringId, 'variants', 'table'] as const;
export const VARIANT_KEY = (variantId: string) => ['commerce', 'site', 'offerings', 'variants', variantId] as const;
export const VARIANT_BOM_KEY = (variantId: string) => [...VARIANT_KEY(variantId), 'bom'] as const;
export const OFFERING_CHANNELS_KEY = (offeringId: string) =>
  ['commerce', 'site', 'offerings', offeringId, 'channels'] as const;
export const CHANNEL_VARIANTS_KEY = (offeringId: string, targetId: string) =>
  [...OFFERING_CHANNELS_KEY(offeringId), targetId, 'variants'] as const;

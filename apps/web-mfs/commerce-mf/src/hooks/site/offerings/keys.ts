export const OFFERINGS_KEY = ['commerce', 'site', 'offerings'] as const;
export const SITE_OFFERINGS_TABLE_KEY = ['commerce', 'site', 'offerings', 'table'] as const;
export const SITE_OFFERING_VARIANTS_TABLE_KEY = (offeringId: string) =>
  ['commerce', 'site', 'offerings', offeringId, 'variants', 'table'] as const;
export const VARIANT_KEY = (variantId: string) => ['commerce', 'site', 'offerings', 'variants', variantId] as const;

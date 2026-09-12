export const OFFERINGS_KEY = ['commerce', 'le', 'offerings'] as const;
export const LE_OFFERINGS_TABLE_KEY = ['commerce', 'le', 'offerings', 'table'] as const;
export const LE_OFFERING_VARIANTS_TABLE_KEY = (offeringId: string) =>
  ['commerce', 'le', 'offerings', offeringId, 'variants', 'table'] as const;
export const VARIANT_KEY = (variantId: string) => ['commerce', 'le', 'offerings', 'variants', variantId] as const;

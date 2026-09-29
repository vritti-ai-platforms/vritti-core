export const OFFERINGS_KEY = ['commerce', 'org', 'offerings'] as const;
export const ORG_OFFERINGS_TABLE_KEY = ['commerce', 'org', 'offerings', 'table'] as const;
export const ORG_OFFERING_VARIANTS_TABLE_KEY = (offeringId: string) =>
  ['commerce', 'org', 'offerings', offeringId, 'variants', 'table'] as const;
export const VARIANT_KEY = (variantId: string) => ['commerce', 'org', 'offerings', 'variants', variantId] as const;
export const VARIANT_BOM_KEY = (variantId: string) => [...VARIANT_KEY(variantId), 'bom'] as const;

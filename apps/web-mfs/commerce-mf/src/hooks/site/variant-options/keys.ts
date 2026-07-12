export const VARIANT_OPTIONS_KEY = ['commerce', 'variant-options'] as const;
export const VARIANT_OPTIONS_BY_CATALOG_KEY = (catalogId: string) => [...VARIANT_OPTIONS_KEY, catalogId] as const;

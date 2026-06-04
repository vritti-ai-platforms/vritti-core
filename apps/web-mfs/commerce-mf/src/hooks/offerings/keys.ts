export const OFFERINGS_KEY = ['commerce', 'offerings'] as const;
export const OFFERINGS_TABLE_KEY = [...OFFERINGS_KEY, 'table'] as const;
export const OFFERINGS_TABLE_BY_CATALOG_KEY = (catalogId: string) => [...OFFERINGS_TABLE_KEY, catalogId] as const;

export const OFFERING_KEY = ['offering'] as const;
export const OFFERING_DETAIL_KEY = (catalogId: string, offeringId: string) =>
  [...OFFERING_KEY, catalogId, offeringId] as const;
export const OFFERING_MODIFIERS_KEY = (catalogId: string, offeringId: string) =>
  [...OFFERING_KEY, catalogId, offeringId, 'modifiers'] as const;
export const OFFERING_VARIANTS_KEY = (catalogId: string, offeringId: string) =>
  [...OFFERING_KEY, catalogId, offeringId, 'variants'] as const;

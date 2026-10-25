export const OFFERINGS_KEY = ['commerce', 'org', 'offerings'] as const;
export const ORG_OFFERINGS_TABLE_KEY = ['commerce', 'org', 'offerings', 'table'] as const;
export const ORG_OFFERING_VARIANTS_TABLE_KEY = (offeringId: string) =>
  ['commerce', 'org', 'offerings', offeringId, 'variants', 'table'] as const;
export const VARIANT_KEY = (variantId: string) => ['commerce', 'org', 'offerings', 'variants', variantId] as const;
export const VARIANT_BOM_KEY = (variantId: string) => [...VARIANT_KEY(variantId), 'bom'] as const;
export const OFFERING_CHANNELS_KEY = (offeringId: string) =>
  ['commerce', 'org', 'offerings', offeringId, 'channels'] as const;
export const CHANNEL_VARIANTS_KEY = (offeringId: string, targetId: string) =>
  [...OFFERING_CHANNELS_KEY(offeringId), targetId, 'variants'] as const;
export const MARK_OFFERINGS_ACTIVE_KEY = [...OFFERINGS_KEY, 'mark-active'] as const;
export const MARK_OFFERINGS_INACTIVE_KEY = [...OFFERINGS_KEY, 'mark-inactive'] as const;
export const MARK_OFFERING_VARIANTS_ACTIVE_KEY = [...OFFERINGS_KEY, 'variants', 'mark-active'] as const;
export const MARK_OFFERING_VARIANTS_INACTIVE_KEY = [...OFFERINGS_KEY, 'variants', 'mark-inactive'] as const;

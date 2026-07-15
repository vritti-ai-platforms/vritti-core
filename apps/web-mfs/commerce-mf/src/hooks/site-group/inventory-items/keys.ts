export const SITE_GROUP_INVENTORY_ITEMS_MATRIX_KEY = (siteIds: string[]) =>
  ['commerce', 'site-group', 'inventory-items', 'matrix', siteIds] as const;
export const SITE_GROUP_INVENTORY_ITEMS_AVAILABILITY_KEY = (siteIds: string[]) =>
  ['commerce', 'site-group', 'inventory-items', 'availability', siteIds] as const;
export const SITE_GROUP_INVENTORY_ITEMS_LEVELS_KEY = (siteIds: string[]) =>
  ['commerce', 'site-group', 'inventory-items', 'levels', siteIds] as const;

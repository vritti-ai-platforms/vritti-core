export const STOCK_STATUSES = [
  'OUT_OF_STOCK',
  'BELOW_SAFETY_STOCK',
  'REORDER',
  'HEALTHY',
  'OVER_MAX',
  'IN_STOCK',
] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const SITE_ITEM_STATUSES = ['ACTIVE', 'BLOCKED'] as const;
export type SiteItemStatus = (typeof SITE_ITEM_STATUSES)[number];

export const REPLENISHMENT_METHODS = ['MANUAL', 'REORDER_POINT'] as const;
export type ReplenishmentMethod = (typeof REPLENISHMENT_METHODS)[number];

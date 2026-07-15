// Inventory-items permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope the feature is exposed in; codes are scope.feature.permission.
export const ORG_INVENTORY_ITEMS = {
  featureCode: 'inventory-items',
  view: 'org.inventory-items.view',
} as const;

export const SITE_INVENTORY_ITEMS = {
  featureCode: 'inventory-items',
  view: 'site.inventory-items.view',
} as const;

export const SITE_GROUP_INVENTORY_ITEMS = {
  featureCode: 'inventory-items',
  view: 'site-group.inventory-items.view',
} as const;

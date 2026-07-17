// Inventory-items permission codes — MUST match the cloud catalog's authored codes exactly.
// One object per workspace scope the feature is exposed in; codes are scope.feature.permission.
export const ORG_INVENTORY_ITEMS = {
  featureCode: 'inventory-items',
  view: 'org.inventory-items.view',
  add: 'org.inventory-items.add',
  edit: 'org.inventory-items.edit',
  delete: 'org.inventory-items.delete',
  conversions: {
    view: 'org.inventory-items.conversions.view',
    add: 'org.inventory-items.conversions.add',
    edit: 'org.inventory-items.conversions.edit',
    delete: 'org.inventory-items.conversions.delete',
  },
  mrp: {
    view: 'org.inventory-items.mrp.view',
    add: 'org.inventory-items.mrp.add',
    edit: 'org.inventory-items.mrp.edit',
    delete: 'org.inventory-items.mrp.delete',
  },
} as const;

export const SITE_INVENTORY_ITEMS = {
  featureCode: 'inventory-items',
  view: 'site.inventory-items.view',
} as const;

export const SITE_GROUP_INVENTORY_ITEMS = {
  featureCode: 'inventory-items',
  view: 'site-group.inventory-items.view',
} as const;

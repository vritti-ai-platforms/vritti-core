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

export const LE_INVENTORY_ITEMS = {
  featureCode: 'inventory-items',
  view: 'le.inventory-items.view',
  prices: {
    view: 'le.inventory-items.prices.view',
  },
  // MRP across the legal entity's buying screens (quotations, item prices): view shows it, edit lets it be entered.
  // Lock or drop these to switch MRP off for a legal entity.
  mrp: {
    view: 'le.inventory-items.mrp.view',
    edit: 'le.inventory-items.mrp.edit',
  },
} as const;

export const SITE_INVENTORY_ITEMS = {
  featureCode: 'inventory-items',
  view: 'site.inventory-items.view',
  enable: 'site.inventory-items.enable',
  edit: 'site.inventory-items.edit',
  prices: {
    view: 'site.inventory-items.prices.view',
  },
  // MRP across the site's buying screens (item prices, goods receipt lots): view shows it, edit lets it be entered
  mrp: {
    view: 'site.inventory-items.mrp.view',
    edit: 'site.inventory-items.mrp.edit',
  },
  locations: {
    view: 'site.inventory-items.locations.view',
    add: 'site.inventory-items.locations.add',
    edit: 'site.inventory-items.locations.edit',
    delete: 'site.inventory-items.locations.delete',
  },
} as const;

export const SITE_GROUP_INVENTORY_ITEMS = {
  featureCode: 'inventory-items',
  view: 'site-group.inventory-items.view',
} as const;

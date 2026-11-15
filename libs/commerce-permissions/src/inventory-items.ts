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
  storageTypes: {
    view: 'org.inventory-items.storage-types.view',
    add: 'org.inventory-items.storage-types.add',
    edit: 'org.inventory-items.storage-types.edit',
    delete: 'org.inventory-items.storage-types.delete',
  },
} as const;

export const LE_INVENTORY_ITEMS = {
  featureCode: 'inventory-items',
  view: 'le.inventory-items.view',
  siteStockLevels: {
    view: 'le.inventory-items.site-stock-levels.view',
    add: 'le.inventory-items.site-stock-levels.add',
    edit: 'le.inventory-items.site-stock-levels.edit',
    delete: 'le.inventory-items.site-stock-levels.delete',
  },
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
  stockLevels: {
    view: 'site.inventory-items.stock-levels.view',
    add: 'site.inventory-items.stock-levels.add',
    edit: 'site.inventory-items.stock-levels.edit',
    delete: 'site.inventory-items.stock-levels.delete',
  },
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

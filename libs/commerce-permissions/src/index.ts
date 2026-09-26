// Barrel — prefer the per-feature subpaths (@vritti/commerce-permissions/uom) in app code.
// Each feature file hosts one object per workspace scope it's exposed in (ORG_*, LE_*, SITE_*, SITE_GROUP_*).

export { LE_CARTS, SITE_CARTS } from './carts';
export { ORG_CATALOG_CHANNELS } from './catalog-channels';
export { ORG_CATALOGS } from './catalogs';
export { ORG_CATEGORIES } from './categories';
export { ORG_COMPANIES } from './companies';
export {
  LE_DIMENSION_TEMPLATES,
  ORG_DIMENSION_TEMPLATES,
  SITE_DIMENSION_TEMPLATES,
} from './dimension-templates';
export {
  ORG_INVENTORY_ITEMS,
  SITE_GROUP_INVENTORY_ITEMS,
  SITE_INVENTORY_ITEMS,
} from './inventory-items';
export { SITE_LOCATIONS } from './locations';
export { LE_OFFERINGS, ORG_OFFERINGS, SITE_OFFERINGS } from './offerings';
export { ORG_PEOPLE } from './people';
export { ORG_STOREFRONT_CATALOG } from './storefront-catalog';
export { LE_SUPPLIERS, SITE_SUPPLIERS } from './suppliers';
export { ORG_TAX_CLASSES } from './tax-classes';
export { ORG_TAX_COMPONENTS } from './tax-components';
export { LE_TAX_GROUPS } from './tax-groups';
export { ORG_TAX_JURISDICTIONS } from './tax-jurisdictions';
export { LE_TAX_REGISTRATIONS } from './tax-registrations';
export { ORG_UOM } from './uom';

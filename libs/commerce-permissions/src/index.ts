// Barrel — prefer the per-feature subpaths (@vritti/commerce-permissions/uom) in app code.
// Each feature file hosts one object per workspace scope it's exposed in (ORG_*, LE_*, SITE_*, SITE_GROUP_*).

export { ORG_CATEGORIES } from './categories';
export { ORG_COMPANIES } from './companies';
export {
  ORG_INVENTORY_ITEMS,
  SITE_GROUP_INVENTORY_ITEMS,
  SITE_INVENTORY_ITEMS,
} from './inventory-items';
export { SITE_LOCATIONS } from './locations';
export { ORG_PEOPLE } from './people';
export { ORG_SALES_CHANNELS } from './sales-channels';
export { LE_SUPPLIERS, SITE_SUPPLIERS } from './suppliers';
export { ORG_TAX_CLASSES } from './tax-classes';
export { ORG_TAX_COMPONENTS } from './tax-components';
export { LE_TAX_GROUPS } from './tax-groups';
export { ORG_TAX_JURISDICTIONS } from './tax-jurisdictions';
export { ORG_UOM } from './uom';

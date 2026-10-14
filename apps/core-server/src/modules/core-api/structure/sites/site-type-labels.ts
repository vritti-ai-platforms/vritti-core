import { type SiteType, SiteTypeValues } from '@/db/schema';

// What an operator reads for each stored value. One place, so a screen cannot end up showing the enum.
export const SITE_TYPE_LABELS: Record<SiteType, string> = {
  [SiteTypeValues.OUTLET]: 'Outlet',
  [SiteTypeValues.WAREHOUSE]: 'Warehouse',
  [SiteTypeValues.PRODUCTION]: 'Production',
};

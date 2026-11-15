import type { SiteType } from '@/db/schema';

export interface AppSiteRow {
  id: string;
  code: string;
  name: string;
  type: SiteType;
  timezone: string;
  legalEntityId: string;
  currencyCode: string;
  sortOrder: number;
}

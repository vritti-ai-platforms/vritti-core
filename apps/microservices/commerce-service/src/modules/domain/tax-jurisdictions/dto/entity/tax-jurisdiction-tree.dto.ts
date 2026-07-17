import type { TaxJurisdictionLevel } from '@/db/schema';

export interface TaxJurisdictionTreeDto {
  id: string;
  name: string;
  code: string;
  level: TaxJurisdictionLevel;
  children?: TaxJurisdictionTreeDto[];
}

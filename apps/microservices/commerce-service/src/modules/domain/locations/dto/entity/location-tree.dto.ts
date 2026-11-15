import type { LocationRole } from '@/db/schema';
import type { LocationFillDto } from './location-fill.dto';

export interface LocationTreeDto {
  id: string;
  name: string;
  locationRole: LocationRole;
  storageTypeId: string | null;
  storageTypeName: string | null;
  isStorageTypeOverridden: boolean;
  inheritedFromLocationName: string | null;
  fill: LocationFillDto | null;
  children?: LocationTreeDto[];
}

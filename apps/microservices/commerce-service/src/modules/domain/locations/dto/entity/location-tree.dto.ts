import type { LocationRole } from '@/db/schema';

export interface LocationTreeDto {
  id: string;
  name: string;
  locationRole: LocationRole;
  children?: LocationTreeDto[];
}

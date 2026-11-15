import type { Location, NewLocation } from '@/db/schema';

export interface LocationStorageTypeChange {
  id: string;
  name: string;
  storageTypeId: string | null;
}

export interface LocationUpdatePlan {
  location: Location;
  values: Partial<NewLocation>;
  nextPath: string | null;
  assignedStorageTypeId: string | null;
  storageTypeChanges: LocationStorageTypeChange[];
}

export interface StoredItemPlacementDto {
  locationName: string;
  inventoryItemId: string;
  inventoryItemName: string;
  storageTypeId: string;
}

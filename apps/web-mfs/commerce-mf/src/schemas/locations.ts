import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { CreateResponse, TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import type { Resolver } from 'react-hook-form';

export const LocationRoleValues = {
  STORAGE: 'STORAGE',
  RESERVED_STORAGE: 'RESERVED_STORAGE',
  ZONE: 'ZONE',
} as const;
export type LocationRole = (typeof LocationRoleValues)[keyof typeof LocationRoleValues];

export const LocationRoleLabels: Record<LocationRole, string> = {
  STORAGE: 'Storage',
  RESERVED_STORAGE: 'Reserved Storage',
  ZONE: 'Zone',
};

const locationRoleEnumValues = Object.values(LocationRoleValues) as [LocationRole, ...LocationRole[]];

const _locationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(50),
  parentId: z.uuid().optional().nullable(),
  sortOrder: zodNumericField({ required: 'Sort order is required', min: 1 }),
  locationRole: z.enum(locationRoleEnumValues),
  isActive: z.boolean(),
  area: z.string().max(100).optional().or(z.literal('')),
  managerId: z.uuid().optional().nullable(),
  storageTypeId: z.uuid().optional().nullable(),
  inheritStorageType: z.boolean(),
});

export type LocationFormData = {
  name: string;
  code: string;
  parentId?: string | null;
  sortOrder: number;
  locationRole: LocationRole;
  isActive: boolean;
  area: string;
  managerId: string;
  storageTypeId?: string | null;
  inheritStorageType: boolean;
};
export const locationFormResolver = zodResolver(_locationSchema) as unknown as Resolver<LocationFormData>;
export type CreateLocationResponse = CreateResponse<LocationData>;

export type CreateLocationData = Omit<LocationFormData, 'storageTypeId' | 'inheritStorageType'> & {
  storageTypeId?: string;
};

export interface LocationFillData {
  capacityPercent: number;
  weightUsed: number;
  weightMax: number | null;
  volumeUsed: number;
  volumeMax: number | null;
  unconfiguredItemCount: number;
}

export interface LocationStorageTypeFields {
  storageTypeId: string | null;
  storageTypeName: string | null;
  isStorageTypeOverridden: boolean;
  inheritedFromLocationName: string | null;
  fill: LocationFillData | null;
}

export const LocationFillStatusValues = {
  OK: 'OK',
  NEARLY_FULL: 'NEARLY_FULL',
  OVER_CAPACITY: 'OVER_CAPACITY',
} as const;
export type LocationFillStatus = (typeof LocationFillStatusValues)[keyof typeof LocationFillStatusValues];

export const LocationFillStatusLabels: Record<LocationFillStatus, string> = {
  [LocationFillStatusValues.OK]: 'Room left',
  [LocationFillStatusValues.NEARLY_FULL]: 'Nearly full',
  [LocationFillStatusValues.OVER_CAPACITY]: 'Over capacity',
};

// Places a capacity percentage on the fill scale: 80% and up is nearly full, past 100% is over capacity
export function locationFillStatus(capacityPercent: number): LocationFillStatus {
  if (capacityPercent > 100) return LocationFillStatusValues.OVER_CAPACITY;
  if (capacityPercent >= 80) return LocationFillStatusValues.NEARLY_FULL;
  return LocationFillStatusValues.OK;
}

export interface LocationData extends LocationStorageTypeFields {
  id: string;
  organizationId: string;
  siteId: string;
  name: string;
  code: string;
  parentId: string | null;
  parentName: string | null;
  path: string;
  sortOrder: number;
  locationRole: LocationRole;
  area: string | null;
  managerId: string | null;
  isActive: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LocationTreeNode extends LocationStorageTypeFields {
  id: string;
  name: string;
  locationRole: LocationRole;
  children?: LocationTreeNode[];
}

export interface LocationCountData {
  count: number;
}

export type LocationChildrenTableResponse = TableResponse<LocationData>;

export interface LocationItemRow {
  inventoryItemId: string;
  itemName: string;
  itemSku: string;
  uomSymbol: string | null;
  totalQuantity: number;
  availableQuantity: number;
  totalValue: CurrencyValue | null;
  batchCount: number;
}

export interface LocationItemQuantRow {
  quantId: string;
  lotNumber: string | null;
  expiryDate: string | null;
  quantity: number;
  availableQuantity: number;
  unitCost: CurrencyValue | null;
  quantValue: CurrencyValue | null;
}

export type LocationItemsTableResponse = TableResponse<LocationItemRow>;

export interface ReorderLocationsData {
  parentId: string | null;
  orderedIds: string[];
}

export type UpdateLocationData = Partial<
  Pick<
    LocationFormData,
    'name' | 'code' | 'parentId' | 'sortOrder' | 'locationRole' | 'isActive' | 'area' | 'managerId'
  >
> & {
  storageTypeId?: string | null;
  inheritStorageType?: boolean;
};

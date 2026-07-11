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
  parentId: z.string().optional().nullable(),
  sortOrder: zodNumericField({ required: 'Sort order is required', min: 1 }),
  locationRole: z.enum(locationRoleEnumValues),
  isActive: z.boolean(),
  area: z.string().max(100).optional().or(z.literal('')),
  managerId: z.string().max(100).optional().or(z.literal('')),
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
};
export const locationFormResolver = zodResolver(_locationSchema) as unknown as Resolver<LocationFormData>;
export type CreateLocationResponse = CreateResponse<LocationData>;

export interface LocationData {
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

export interface LocationTreeNode {
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
  itemCode: string;
  uomSymbol: string | null;
  totalQuantity: number;
  availableQuantity: number;
  totalValue: { currency: string; value: string } | null;
  batchCount: number;
}

export interface LocationItemQuantRow {
  quantId: string;
  lotNumber: string | null;
  expiryDate: string | null;
  quantity: number;
  availableQuantity: number;
  unitCost: { currency: string; value: string } | null;
  quantValue: { currency: string; value: string } | null;
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
>;

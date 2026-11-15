import type Decimal from '@vritti/api-sdk/decimal';

export interface FillMemberRow {
  rootId: string;
  locationId: string;
  storageTypeId: string | null;
}

export interface FillQuantRow {
  locationId: string;
  inventoryItemId: string;
  packUomId: string | null;
  quantity: number;
  primaryUomId: string;
  primaryWeight: number | null;
  primaryVolume: number | null;
  packWeight: number | null;
  packVolume: number | null;
}

export interface LocationFillInputs {
  locationIds: string[];
  members: FillMemberRow[];
  quants: FillQuantRow[];
  storageTypeIds: string[];
  inventoryItemIds: string[];
  packUomPairs: { inventoryItemId: string; uomId: string }[];
}

export interface FillStorageTypeLimit {
  id: string;
  maxWeight: number | null;
  maxVolume: number | null;
}

export interface FillUsageRule {
  inventoryItemId: string;
  storageTypeId: string;
  usagePerPrimaryUnit: Decimal;
}

export interface FillUomFactorSource {
  get(inventoryItemId: string, uomId: string): Decimal | undefined;
}

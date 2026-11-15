import type Decimal from '@vritti/api-sdk/decimal';

export interface StorageAllowanceDto {
  inventoryItemId: string;
  storageTypeId: string;
  maxQuantity: number;
  uomId: string;
}

export interface StorageUsageRuleDto {
  inventoryItemId: string;
  storageTypeId: string;
  usagePerPrimaryUnit: Decimal;
}

export interface UomFactorSource {
  get(inventoryItemId: string, uomId: string): Decimal | undefined;
}

export interface StoredItemPlacementDto {
  locationName: string;
  inventoryItemId: string;
  inventoryItemName: string;
  storageTypeId: string;
}

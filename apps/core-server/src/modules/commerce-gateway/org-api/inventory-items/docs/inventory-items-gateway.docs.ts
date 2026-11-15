import { CreateInventoryItemStorageTypeDto } from '@commerce/inventory-items/dto/request/create-inventory-item-storage-type.dto';
import { UpdateInventoryItemStorageTypeDto } from '@commerce/inventory-items/dto/request/update-inventory-item-storage-type.dto';
import { InventoryItemStorageTypeResponseDto } from '@commerce/inventory-items/dto/response/inventory-item-storage-type-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/responses';

const INVENTORY_ITEM_ID = { name: 'id', description: 'Inventory item ID' };
const ROW_ID = { name: 'rowId', description: 'Item × storage type row ID' };

export function ApiFindInventoryItemStorageTypes() {
  return applyDecorators(
    ApiOperation({
      summary: 'Storage types an inventory item may be stored in',
      description:
        'Each row allows the item in one storage type and caps how much of it one location of that type holds. A storage type without a row does not take the item.',
    }),
    ApiParam(INVENTORY_ITEM_ID),
    ApiResponse({ status: 200, type: [InventoryItemStorageTypeResponseDto] }),
    ApiResponse({ status: 404, description: 'Inventory item not found.' }),
  );
}

export function ApiCreateInventoryItemStorageType() {
  return applyDecorators(
    ApiOperation({
      summary: 'Allow an inventory item in a storage type',
      description:
        '`maxQuantity` is how much of the item fills one location of the type, counted in `uomId` — the item’s primary unit or one of its conversions (e.g. 7 boxes).',
    }),
    ApiParam(INVENTORY_ITEM_ID),
    ApiBody({ type: CreateInventoryItemStorageTypeDto }),
    ApiResponse({ status: 201, description: 'Storage type allowed for the item.' }),
    ApiResponse({ status: 400, description: 'A non-positive quantity, or a unit the item does not convert to.' }),
    ApiResponse({ status: 404, description: 'Inventory item, storage type or unit not found.' }),
    ApiResponse({ status: 409, description: 'The item is already allowed in the storage type.' }),
  );
}

export function ApiUpdateInventoryItemStorageType() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update an item × storage type row',
      description: 'Changes the maximum per location or the unit it is counted in; the storage type cannot change.',
    }),
    ApiParam(INVENTORY_ITEM_ID),
    ApiParam(ROW_ID),
    ApiBody({ type: UpdateInventoryItemStorageTypeDto }),
    ApiResponse({ status: 200, description: 'Row updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'A non-positive quantity, or a unit the item does not convert to.' }),
    ApiResponse({ status: 404, description: 'Row not found on the inventory item.' }),
  );
}

export function ApiDeleteInventoryItemStorageType() {
  return applyDecorators(
    ApiOperation({
      summary: 'Stop allowing an inventory item in a storage type',
    }),
    ApiParam(INVENTORY_ITEM_ID),
    ApiParam(ROW_ID),
    ApiResponse({ status: 200, description: 'Row removed.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Row not found on the inventory item.' }),
    ApiResponse({
      status: 409,
      description: 'The item is stored in a location of that storage type.',
    }),
  );
}

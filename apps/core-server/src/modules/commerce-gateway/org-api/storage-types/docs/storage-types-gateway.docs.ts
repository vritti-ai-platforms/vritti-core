import { CreateStorageTypeDto } from '@commerce/storage-types/dto/request/create-storage-type.dto';
import { UpdateStorageTypeDto } from '@commerce/storage-types/dto/request/update-storage-type.dto';
import { StorageTypeResponseDto } from '@commerce/storage-types/dto/response/storage-type-response.dto';
import { StorageTypeTableResponseDto } from '@commerce/storage-types/dto/response/storage-type-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/responses';

const STORAGE_TYPE_ID = { name: 'id', description: 'Storage type ID' };

export function ApiFindForTableStorageTypes() {
  return applyDecorators(
    ApiOperation({
      summary: 'Storage types table',
      description:
        'Every storage type of the organization, active and inactive, with how many locations use it and how many items are allowed in it. Paging, sorting and filters come from the saved table state. Weights are in grams, volumes in millilitres and dimensions in millimetres.',
    }),
    ApiResponse({ status: 200, type: StorageTypeTableResponseDto }),
  );
}

export function ApiFindStorageTypeById() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a storage type' }),
    ApiParam(STORAGE_TYPE_ID),
    ApiResponse({ status: 200, type: StorageTypeResponseDto }),
    ApiResponse({ status: 404, description: 'Storage type not found.' }),
  );
}

export function ApiCreateStorageType() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a storage type',
      description:
        'A physical kind of place (shelf, pallet rack, fridge) that STORAGE locations reference. Limits are optional and in base units: weight in grams, volume in millilitres, inside dimensions in millimetres. Every location holds a capacity of 100.',
    }),
    ApiBody({ type: CreateStorageTypeDto }),
    ApiResponse({ status: 201, description: 'Storage type created.' }),
    ApiResponse({ status: 400, description: 'A malformed code, a non-positive limit or more than 3 decimals.' }),
    ApiResponse({ status: 409, description: 'Another storage type of the organization has the code.' }),
  );
}

export function ApiUpdateStorageType() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a storage type',
      description: 'Only the fields sent change. Null clears an optional limit.',
    }),
    ApiParam(STORAGE_TYPE_ID),
    ApiBody({ type: UpdateStorageTypeDto }),
    ApiResponse({ status: 200, description: 'Storage type updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'A malformed code, a non-positive limit or more than 3 decimals.' }),
    ApiResponse({ status: 404, description: 'Storage type not found.' }),
    ApiResponse({ status: 409, description: 'Another storage type of the organization has the code.' }),
  );
}

export function ApiDeleteStorageType() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a storage type' }),
    ApiParam(STORAGE_TYPE_ID),
    ApiResponse({ status: 200, description: 'Storage type deleted.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Storage type not found.' }),
    ApiResponse({ status: 409, description: 'Locations or allowed items still reference the storage type.' }),
  );
}

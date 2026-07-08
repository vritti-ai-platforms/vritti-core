import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { LocationItemQuantResponseDto } from '../dto/response/location-item-quant-response.dto';
import { LocationItemTableResponseDto } from '../dto/response/location-item-table-response.dto';

export function ApiGetLocationItemsTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a location stocked-items table',
      description: "Returns the location's items grouped across non-zero quants, with totals and batch counts.",
    }),
    ApiParam({ name: 'locationId', description: 'Storage location ID' }),
    ApiResponse({
      status: 200,
      description: 'Location items retrieved successfully.',
      type: LocationItemTableResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetLocationItemQuants() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get the per-item quant breakdown for a location',
      description: 'Returns the per-quant (cost batch) breakdown for a single item within a location.',
    }),
    ApiParam({ name: 'locationId', description: 'Storage location ID' }),
    ApiParam({ name: 'itemId', description: 'Inventory item ID' }),
    ApiResponse({
      status: 200,
      description: 'Item quants retrieved successfully.',
      type: [LocationItemQuantResponseDto],
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

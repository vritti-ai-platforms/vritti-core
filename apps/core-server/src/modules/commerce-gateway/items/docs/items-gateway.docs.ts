import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { CreateItemDto } from '../dto/request/create-item.dto';
import { SaveItemModifiersDto } from '../dto/request/save-item-modifiers.dto';
import { SaveOptionsDto } from '../dto/request/save-options.dto';
import { UpdateItemDto } from '../dto/request/update-item.dto';
import { UpdateVariantDto } from '../dto/request/update-variant.dto';
import { ItemDetailResponseDto, ItemVariantResponseDto } from '../dto/response/item-detail-response.dto';
import { ItemModifierGroupResponseDto } from '../dto/response/item-modifier-group-response.dto';
import { ItemResponseDto } from '../dto/response/item-response.dto';
import { ItemsTableResponseDto } from '../dto/response/items-table-response.dto';

export function ApiGetItemsTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get items table for a business unit',
      description: 'Returns paginated, filtered, and sorted items using server-stored table state.',
    }),
    ApiQuery({ name: 'buId', description: 'Business unit ID', required: true }),
    ApiResponse({ status: 200, description: 'Items table retrieved successfully.', type: ItemsTableResponseDto }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateItem() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create an item',
      description: 'Creates a new catalog item. organizationId is resolved from the authenticated user.',
    }),
    ApiBody({ type: CreateItemDto }),
    ApiResponse({ status: 201, description: 'Item created successfully.', type: ItemResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetItem() {
  return applyDecorators(
    ApiOperation({ summary: 'Get an item by ID', description: 'Returns item with full details including options and variants.' }),
    ApiParam({ name: 'id', description: 'Item ID' }),
    ApiResponse({ status: 200, description: 'Item retrieved successfully.', type: ItemDetailResponseDto }),
    ApiResponse({ status: 404, description: 'Item not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdateItem() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an item' }),
    ApiParam({ name: 'id', description: 'Item ID' }),
    ApiBody({ type: UpdateItemDto }),
    ApiResponse({ status: 200, description: 'Item updated successfully.', type: ItemResponseDto }),
    ApiResponse({ status: 404, description: 'Item not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDeleteItem() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete an item' }),
    ApiParam({ name: 'id', description: 'Item ID' }),
    ApiResponse({ status: 200, description: 'Item deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Item not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSaveItemOptions() {
  return applyDecorators(
    ApiOperation({ summary: 'Bulk save item options', description: 'Replaces all options for an item with the provided set.' }),
    ApiParam({ name: 'id', description: 'Item ID' }),
    ApiBody({ type: SaveOptionsDto }),
    ApiResponse({ status: 200, description: 'Options saved successfully.', type: ItemDetailResponseDto }),
    ApiResponse({ status: 404, description: 'Item not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGenerateItemVariants() {
  return applyDecorators(
    ApiOperation({ summary: 'Generate item variants', description: 'Generates variants based on the item options.' }),
    ApiParam({ name: 'id', description: 'Item ID' }),
    ApiResponse({ status: 201, description: 'Variants generated successfully.', type: ItemVariantResponseDto, isArray: true }),
    ApiResponse({ status: 404, description: 'Item not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiListItemVariants() {
  return applyDecorators(
    ApiOperation({ summary: 'List item variants' }),
    ApiParam({ name: 'id', description: 'Item ID' }),
    ApiResponse({ status: 200, description: 'Variants retrieved successfully.', type: ItemVariantResponseDto, isArray: true }),
    ApiResponse({ status: 404, description: 'Item not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdateItemVariant() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an item variant' }),
    ApiParam({ name: 'id', description: 'Item ID' }),
    ApiParam({ name: 'variantId', description: 'Variant ID' }),
    ApiBody({ type: UpdateVariantDto }),
    ApiResponse({ status: 200, description: 'Variant updated successfully.', type: ItemVariantResponseDto }),
    ApiResponse({ status: 404, description: 'Variant not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDeleteItemVariant() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete an item variant' }),
    ApiParam({ name: 'id', description: 'Item ID' }),
    ApiParam({ name: 'variantId', description: 'Variant ID' }),
    ApiResponse({ status: 200, description: 'Variant deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Variant not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiListItemModifiers() {
  return applyDecorators(
    ApiOperation({ summary: 'List modifier groups assigned to an item' }),
    ApiParam({ name: 'id', description: 'Item ID' }),
    ApiResponse({ status: 200, description: 'Modifier groups retrieved successfully.', type: ItemModifierGroupResponseDto, isArray: true }),
    ApiResponse({ status: 404, description: 'Item not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSaveItemModifiers() {
  return applyDecorators(
    ApiOperation({ summary: 'Save modifier group assignments for an item', description: 'Replaces all modifier group assignments for the item.' }),
    ApiParam({ name: 'id', description: 'Item ID' }),
    ApiBody({ type: SaveItemModifiersDto }),
    ApiResponse({ status: 200, description: 'Modifier assignments saved successfully.', type: ItemModifierGroupResponseDto, isArray: true }),
    ApiResponse({ status: 404, description: 'Item not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

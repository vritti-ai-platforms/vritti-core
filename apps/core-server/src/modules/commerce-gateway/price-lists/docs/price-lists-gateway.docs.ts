import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { CreatePriceListDto } from '../dto/request/create-price-list.dto';
import { SavePriceListItemsDto } from '../dto/request/save-price-list-items.dto';
import { SaveTerminalPriceListsDto } from '../dto/request/save-terminal-price-lists.dto';
import { UpdatePriceListDto } from '../dto/request/update-price-list.dto';
import { PriceListItemResponseDto } from '../dto/response/price-list-item-response.dto';
import { PriceListResponseDto } from '../dto/response/price-list-response.dto';
import { PriceListTableResponseDto } from '../dto/response/price-list-table-response.dto';
import { TerminalPriceListResponseDto } from '../dto/response/terminal-price-list-response.dto';
import { TerminalSellableItemResponseDto } from '../dto/response/terminal-sellable-item-response.dto';

export function ApiTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get price lists table',
      description: 'Returns paginated, filtered, and sorted price lists using server-stored table state.',
    }),
    ApiResponse({ status: 200, description: 'Price lists table retrieved successfully.', type: PriceListTableResponseDto }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get price list select options',
      description: 'Returns paginated price list options for select dropdowns.',
    }),
    ApiQuery({ name: 'search', description: 'Search term to filter by name', required: false }),
    ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false }),
    ApiQuery({ name: 'offset', description: 'Number of results to skip', required: false }),
    ApiQuery({ name: 'values', description: 'Comma-separated IDs to fetch specific options', required: false }),
    ApiQuery({ name: 'excludeIds', description: 'Comma-separated IDs to exclude', required: false }),
    ApiResponse({ status: 200, description: 'Price list select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSelectItemVariants() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get item variant select options eligible for price lists',
      description: 'Returns paginated item variant options eligible for price list assignment.',
    }),
    ApiQuery({ name: 'search', description: 'Search term to filter by name or SKU', required: false }),
    ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false }),
    ApiQuery({ name: 'offset', description: 'Number of results to skip', required: false }),
    ApiQuery({ name: 'values', description: 'Comma-separated IDs to fetch specific options', required: false }),
    ApiQuery({ name: 'excludeIds', description: 'Comma-separated IDs to exclude', required: false }),
    ApiResponse({ status: 200, description: 'Item variant select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiListTerminalPriceLists() {
  return applyDecorators(
    ApiOperation({ summary: 'List price list assignments for a POS terminal' }),
    ApiParam({ name: 'terminalId', description: 'POS terminal ID' }),
    ApiResponse({
      status: 200,
      description: 'Terminal price list assignments retrieved successfully.',
      type: TerminalPriceListResponseDto,
      isArray: true,
    }),
    ApiResponse({ status: 404, description: 'POS terminal not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSaveTerminalPriceLists() {
  return applyDecorators(
    ApiOperation({
      summary: 'Replace price list assignments for a POS terminal',
      description: 'Replaces all price list assignments for the terminal with the provided set.',
    }),
    ApiParam({ name: 'terminalId', description: 'POS terminal ID' }),
    ApiBody({ type: SaveTerminalPriceListsDto }),
    ApiResponse({ status: 200, description: 'Terminal price list assignments saved successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 404, description: 'POS terminal or price list not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiListTerminalSellableItems() {
  return applyDecorators(
    ApiOperation({
      summary: 'List sellable items for a POS terminal',
      description: 'Returns resolved sellable inventory items for a terminal from its assigned price lists.',
    }),
    ApiParam({ name: 'terminalId', description: 'POS terminal ID' }),
    ApiResponse({
      status: 200,
      description: 'Sellable items retrieved successfully.',
      type: TerminalSellableItemResponseDto,
      isArray: true,
    }),
    ApiResponse({ status: 404, description: 'POS terminal not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiListPriceListItems() {
  return applyDecorators(
    ApiOperation({ summary: 'List inventory item assignments for a price list' }),
    ApiParam({ name: 'id', description: 'Price list ID' }),
    ApiResponse({
      status: 200,
      description: 'Price list items retrieved successfully.',
      type: PriceListItemResponseDto,
      isArray: true,
    }),
    ApiResponse({ status: 404, description: 'Price list not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSavePriceListItems() {
  return applyDecorators(
    ApiOperation({
      summary: 'Replace inventory item assignments for a price list',
      description: 'Replaces all inventory item assignments for the price list with the provided set.',
    }),
    ApiParam({ name: 'id', description: 'Price list ID' }),
    ApiBody({ type: SavePriceListItemsDto }),
    ApiResponse({ status: 200, description: 'Price list items saved successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 404, description: 'Price list or item not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiFindById() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a price list by ID' }),
    ApiParam({ name: 'id', description: 'Price list ID' }),
    ApiResponse({ status: 200, description: 'Price list retrieved successfully.', type: PriceListResponseDto }),
    ApiResponse({ status: 404, description: 'Price list not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a price list',
      description: 'Creates a new price list for the business unit. organizationId is resolved from the authenticated user.',
    }),
    ApiBody({ type: CreatePriceListDto }),
    ApiResponse({ status: 201, description: 'Price list created successfully.', type: PriceListResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdate() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a price list' }),
    ApiParam({ name: 'id', description: 'Price list ID' }),
    ApiBody({ type: UpdatePriceListDto }),
    ApiResponse({ status: 200, description: 'Price list updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 404, description: 'Price list not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDelete() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a price list' }),
    ApiParam({ name: 'id', description: 'Price list ID' }),
    ApiResponse({ status: 200, description: 'Price list deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Price list not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

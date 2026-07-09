import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { CreatePosTerminalDto } from '../dto/request/create-pos-terminal.dto';
import { UpdatePosTerminalDto } from '../dto/request/update-pos-terminal.dto';
import { PosTerminalResponseDto } from '../dto/response/pos-terminal-response.dto';
import { PosTerminalTableResponseDto } from '../dto/response/pos-terminal-table-response.dto';

export function ApiTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get POS terminals table',
      description: 'Returns paginated, filtered, and sorted POS terminals using server-stored table state.',
    }),
    ApiResponse({
      status: 200,
      description: 'POS terminals table retrieved successfully.',
      type: PosTerminalTableResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiSelectLocations() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get POS-role storage location select options',
      description: 'Returns paginated POS-role storage location options for select dropdowns.',
    }),
    ApiQuery({ name: 'search', description: 'Search term to filter by name', required: false }),
    ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false }),
    ApiQuery({ name: 'offset', description: 'Number of results to skip', required: false }),
    ApiQuery({ name: 'values', description: 'Comma-separated IDs to fetch specific options', required: false }),
    ApiQuery({ name: 'excludeIds', description: 'Comma-separated IDs to exclude', required: false }),
    ApiResponse({ status: 200, description: 'Storage location select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiFindById() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a POS terminal by ID' }),
    ApiParam({ name: 'id', description: 'POS terminal ID' }),
    ApiResponse({ status: 200, description: 'POS terminal retrieved successfully.', type: PosTerminalResponseDto }),
    ApiResponse({ status: 404, description: 'POS terminal not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreate() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a POS terminal',
      description:
        'Creates a new POS terminal for the business unit. organizationId is resolved from the authenticated user.',
    }),
    ApiBody({ type: CreatePosTerminalDto }),
    ApiResponse({ status: 201, description: 'POS terminal created successfully.', type: PosTerminalResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdate() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a POS terminal' }),
    ApiParam({ name: 'id', description: 'POS terminal ID' }),
    ApiBody({ type: UpdatePosTerminalDto }),
    ApiResponse({ status: 200, description: 'POS terminal updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 404, description: 'POS terminal not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDelete() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a POS terminal' }),
    ApiParam({ name: 'id', description: 'POS terminal ID' }),
    ApiResponse({ status: 200, description: 'POS terminal deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'POS terminal not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { CreateTaxGroupDto } from '../dto/request/create-tax-group.dto';
import { UpdateTaxGroupDto } from '../dto/request/update-tax-group.dto';
import { TaxGroupResponseDto } from '../dto/response/tax-group-response.dto';
import { TaxGroupTableResponseDto } from '../dto/response/tax-group-table-response.dto';

export function ApiFindForTableTaxGroups() {
  return applyDecorators(
    ApiOperation({
      summary: 'List tax groups for the data table',
      description: 'Returns a paginated page of tax groups using the user’s saved filter/sort/pagination state.',
    }),
    ApiResponse({ status: 200, description: 'Tax groups retrieved successfully.', type: TaxGroupTableResponseDto }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateTaxGroup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a tax group',
      description:
        'Creates a new tax group for the business unit. organizationId is resolved from the authenticated user.',
    }),
    ApiBody({ type: CreateTaxGroupDto }),
    ApiResponse({ status: 201, description: 'Tax group created successfully.', type: TaxGroupResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetTaxGroup() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a tax group by ID' }),
    ApiParam({ name: 'id', description: 'Tax group ID' }),
    ApiResponse({ status: 200, description: 'Tax group retrieved successfully.', type: TaxGroupResponseDto }),
    ApiResponse({ status: 404, description: 'Tax group not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdateTaxGroup() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a tax group' }),
    ApiParam({ name: 'id', description: 'Tax group ID' }),
    ApiBody({ type: UpdateTaxGroupDto }),
    ApiResponse({ status: 200, description: 'Tax group updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Tax group not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDeleteTaxGroup() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a tax group' }),
    ApiParam({ name: 'id', description: 'Tax group ID' }),
    ApiResponse({ status: 200, description: 'Tax group deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Tax group not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

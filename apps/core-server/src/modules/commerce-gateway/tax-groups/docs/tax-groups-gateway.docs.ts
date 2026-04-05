import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { TaxGroupResponseDto } from '../dto/tax-group-response.dto';
import { CreateTaxGroupDto } from '../dto/create-tax-group.dto';
import { UpdateTaxGroupDto } from '../dto/update-tax-group.dto';

export function ApiListTaxGroups() {
  return applyDecorators(
    ApiOperation({
      summary: 'List tax groups for a business unit',
      description: 'Returns all tax groups for the specified business unit, ordered by sort order.',
    }),
    ApiQuery({ name: 'buId', description: 'Business unit ID', required: true }),
    ApiResponse({ status: 200, description: 'Tax groups retrieved successfully.', type: TaxGroupResponseDto, isArray: true }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateTaxGroup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a tax group',
      description: 'Creates a new tax group for the business unit. organizationId is resolved from the authenticated user.',
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
    ApiResponse({ status: 200, description: 'Tax group updated successfully.', type: TaxGroupResponseDto }),
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

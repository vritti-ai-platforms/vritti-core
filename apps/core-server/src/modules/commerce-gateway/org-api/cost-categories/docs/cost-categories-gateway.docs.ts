import { CreateCostCategoryDto } from '@commerce/cost-categories/dto/request/create-cost-category.dto';
import { UpdateCostCategoryDto } from '@commerce/cost-categories/dto/request/update-cost-category.dto';
import { CostCategoryResponseDto } from '@commerce/cost-categories/dto/response/cost-category-response.dto';
import { CostCategoryTableResponseDto } from '@commerce/cost-categories/dto/response/cost-category-table-response.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/responses';

const COST_CATEGORY_ID = { name: 'id', description: 'Cost category ID' };

export function ApiFindForTableCostCategories() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cost categories table',
      description:
        'Every cost category of the organization, active and inactive, with whether it can be deleted. Paging, sorting and filters come from the saved table state.',
    }),
    ApiResponse({ status: 200, type: CostCategoryTableResponseDto }),
  );
}

export function ApiFindCostCategoryById() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a cost category' }),
    ApiParam(COST_CATEGORY_ID),
    ApiResponse({ status: 200, type: CostCategoryResponseDto }),
    ApiResponse({ status: 404, description: 'Cost category not found.' }),
  );
}

export function ApiCreateCostCategory() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a cost category',
      description:
        'A named bucket that landed-cost rows are booked against. The kind is a fixed enum used for reporting rollups; an organization holds at most one ITEM-kind category.',
    }),
    ApiBody({ type: CreateCostCategoryDto }),
    ApiResponse({ status: 201, description: 'Cost category created.' }),
    ApiResponse({ status: 400, description: 'A malformed code, a missing name or an unknown kind.' }),
    ApiResponse({ status: 409, description: 'The organization already has an ITEM-kind cost category.' }),
  );
}

export function ApiUpdateCostCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a cost category', description: 'Only the fields sent change.' }),
    ApiParam(COST_CATEGORY_ID),
    ApiBody({ type: UpdateCostCategoryDto }),
    ApiResponse({ status: 200, description: 'Cost category updated.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'An empty or over-long name.' }),
    ApiResponse({ status: 404, description: 'Cost category not found.' }),
  );
}

export function ApiDeactivateCostCategory() {
  return applyDecorators(
    ApiOperation({
      summary: 'Deactivate a cost category',
      description: 'The category stays on existing cost rows but can no longer be picked.',
    }),
    ApiParam(COST_CATEGORY_ID),
    ApiResponse({ status: 200, description: 'Cost category deactivated.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Cost category not found.' }),
  );
}

export function ApiActivateCostCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Activate a cost category' }),
    ApiParam(COST_CATEGORY_ID),
    ApiResponse({ status: 200, description: 'Cost category activated.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Cost category not found.' }),
  );
}

export function ApiDeleteCostCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a cost category' }),
    ApiParam(COST_CATEGORY_ID),
    ApiResponse({ status: 200, description: 'Cost category deleted.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Cost category not found.' }),
    ApiResponse({ status: 409, description: 'The category is reserved by the system or cost rows reference it.' }),
  );
}

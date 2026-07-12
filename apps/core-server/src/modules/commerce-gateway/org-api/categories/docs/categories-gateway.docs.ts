import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { CreateCategoryDto } from '../dto/request/create-category.dto';
import { UpdateCategoryDto } from '../dto/request/update-category.dto';
import { CategoryItemTableResponseDto } from '../dto/response/category-item-table-response.dto';
import { CategoryResponseDto } from '../dto/response/category-response.dto';

export function ApiCreateCategory() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a category',
      description: 'Creates a new category for the sites. organizationId is resolved from the authenticated user.',
    }),
    ApiBody({ type: CreateCategoryDto }),
    ApiResponse({ status: 201, description: 'Category created successfully.', type: CategoryResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetCategoryItemsTable() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get inventory items for a leaf category',
      description:
        'Returns paginated inventory items linked to a CATEGORY-role (leaf) category, using Redis table state.',
    }),
    ApiParam({ name: 'id', description: 'Category ID' }),
    ApiResponse({
      status: 200,
      description: 'Category items retrieved successfully.',
      type: CategoryItemTableResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a category by ID' }),
    ApiParam({ name: 'id', description: 'Category ID' }),
    ApiResponse({ status: 200, description: 'Category retrieved successfully.', type: CategoryResponseDto }),
    ApiResponse({ status: 404, description: 'Category not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdateCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a category' }),
    ApiParam({ name: 'id', description: 'Category ID' }),
    ApiBody({ type: UpdateCategoryDto }),
    ApiResponse({ status: 200, description: 'Category updated successfully.', type: CategoryResponseDto }),
    ApiResponse({ status: 404, description: 'Category not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDeleteCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a category' }),
    ApiParam({ name: 'id', description: 'Category ID' }),
    ApiResponse({ status: 200, description: 'Category deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Category not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

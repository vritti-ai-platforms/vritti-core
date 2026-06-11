import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { CreateCategoryDto } from '../dto/request/create-category.dto';
import { UpdateCategoryDto } from '../dto/request/update-category.dto';
import { CategoryItemTableResponseDto } from '../dto/response/category-item-table-response.dto';
import { CategoryResponseDto } from '../dto/response/category-response.dto';

export function ApiGetCategoriesSelect() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get category select options',
      description: 'Returns paginated category options for the select component, filtered by business unit.',
    }),
    ApiQuery({ name: 'buId', description: 'Business unit ID', required: true }),
    ApiQuery({ name: 'search', description: 'Search term to filter by name', required: false }),
    ApiQuery({ name: 'limit', description: 'Maximum number of results', required: false }),
    ApiQuery({ name: 'offset', description: 'Number of results to skip', required: false }),
    ApiQuery({ name: 'values', description: 'Comma-separated IDs to fetch specific options', required: false }),
    ApiQuery({ name: 'excludeIds', description: 'Comma-separated IDs to exclude', required: false }),
    ApiResponse({ status: 200, description: 'Category select options retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateCategory() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a category',
      description: 'Creates a new category for the business unit. organizationId is resolved from the authenticated user.',
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
      description: 'Returns paginated inventory items linked to a CATEGORY-role (leaf) category, using Redis table state.',
    }),
    ApiParam({ name: 'id', description: 'Category ID' }),
    ApiResponse({ status: 200, description: 'Category items retrieved successfully.', type: CategoryItemTableResponseDto }),
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

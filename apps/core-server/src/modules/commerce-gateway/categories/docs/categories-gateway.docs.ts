import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

export function ApiListCategories() {
  return applyDecorators(
    ApiOperation({
      summary: 'List categories for a business unit',
      description: 'Returns all categories for the specified business unit, ordered by sort order.',
    }),
    ApiQuery({ name: 'buId', description: 'Business unit ID', required: true }),
    ApiResponse({ status: 200, description: 'Categories retrieved successfully.', type: CategoryResponseDto, isArray: true }),
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

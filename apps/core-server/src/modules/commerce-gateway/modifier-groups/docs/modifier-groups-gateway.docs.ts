import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { CreateModifierGroupDto } from '../dto/create-modifier-group.dto';
import { CreateModifierOptionDto } from '../dto/create-modifier-option.dto';
import { ModifierGroupResponseDto, ModifierOptionResponseDto } from '../dto/modifier-group-response.dto';
import { UpdateModifierGroupDto } from '../dto/update-modifier-group.dto';
import { UpdateModifierOptionDto } from '../dto/update-modifier-option.dto';

export function ApiListModifierGroups() {
  return applyDecorators(
    ApiOperation({
      summary: 'List modifier groups for a business unit',
      description: 'Returns all modifier groups for the specified business unit.',
    }),
    ApiQuery({ name: 'buId', description: 'Business unit ID', required: true }),
    ApiResponse({ status: 200, description: 'Modifier groups retrieved successfully.', type: ModifierGroupResponseDto, isArray: true }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiGetModifierGroup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a modifier group with options',
      description: 'Returns a single modifier group with its options.',
    }),
    ApiParam({ name: 'id', description: 'Modifier group ID' }),
    ApiResponse({ status: 200, description: 'Modifier group retrieved successfully.', type: ModifierGroupResponseDto }),
    ApiResponse({ status: 404, description: 'Modifier group not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateModifierGroup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a modifier group',
      description: 'Creates a new modifier group. organizationId is resolved from the authenticated user.',
    }),
    ApiBody({ type: CreateModifierGroupDto }),
    ApiResponse({ status: 201, description: 'Modifier group created successfully.', type: ModifierGroupResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdateModifierGroup() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a modifier group' }),
    ApiParam({ name: 'id', description: 'Modifier group ID' }),
    ApiBody({ type: UpdateModifierGroupDto }),
    ApiResponse({ status: 200, description: 'Modifier group updated successfully.', type: ModifierGroupResponseDto }),
    ApiResponse({ status: 404, description: 'Modifier group not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDeleteModifierGroup() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a modifier group' }),
    ApiParam({ name: 'id', description: 'Modifier group ID' }),
    ApiResponse({ status: 200, description: 'Modifier group deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Modifier group not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiCreateModifierOption() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a modifier option', description: 'Adds a new option to a modifier group.' }),
    ApiParam({ name: 'id', description: 'Modifier group ID' }),
    ApiBody({ type: CreateModifierOptionDto }),
    ApiResponse({ status: 201, description: 'Modifier option created successfully.', type: ModifierOptionResponseDto }),
    ApiResponse({ status: 404, description: 'Modifier group not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiUpdateModifierOption() {
  return applyDecorators(
    ApiOperation({ summary: 'Update a modifier option' }),
    ApiParam({ name: 'id', description: 'Modifier group ID' }),
    ApiParam({ name: 'optionId', description: 'Modifier option ID' }),
    ApiBody({ type: UpdateModifierOptionDto }),
    ApiResponse({ status: 200, description: 'Modifier option updated successfully.', type: ModifierOptionResponseDto }),
    ApiResponse({ status: 404, description: 'Modifier option not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

export function ApiDeleteModifierOption() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a modifier option' }),
    ApiParam({ name: 'id', description: 'Modifier group ID' }),
    ApiParam({ name: 'optionId', description: 'Modifier option ID' }),
    ApiResponse({ status: 200, description: 'Modifier option deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Modifier option not found.' }),
    ApiResponse({ status: 401, description: 'Unauthorized.' }),
  );
}

import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { BusinessUnitDto } from '../dto/entity/business-unit.dto';
import { CreateBusinessUnitInternalDto } from '../dto/request/create-business-unit-internal.dto';
import { SetBuLocksInternalDto } from '../dto/request/set-bu-locks-internal.dto';
import { UpdateBusinessUnitInternalDto } from '../dto/request/update-business-unit-internal.dto';

export function ApiCreateBusinessUnit() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create business unit',
      description:
        'Creates a new business unit for an organization. Computes depth and materialized path from the parent. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiBody({ type: CreateBusinessUnitInternalDto }),
    ApiResponse({ status: 201, description: 'Business unit created successfully.', type: BusinessUnitDto }),
    ApiResponse({ status: 400, description: 'Invalid input data or validation error.' }),
    ApiResponse({ status: 404, description: 'Parent business unit not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiListBusinessUnits() {
  return applyDecorators(
    ApiOperation({
      summary: 'List business units',
      description:
        'Returns a flat list of all business units for an organization, ordered by depth and sort order. Client builds the tree from parentId.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiQuery({ name: 'orgId', description: 'Organization ID', required: true }),
    ApiResponse({ status: 200, description: 'Business units retrieved successfully.', type: [BusinessUnitDto] }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiGetBusinessUnit() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get business unit with subtree',
      description: 'Returns a business unit and all its descendants using materialized path prefix matching.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Business unit ID' }),
    ApiResponse({ status: 200, description: 'Business unit subtree retrieved successfully.', type: [BusinessUnitDto] }),
    ApiResponse({ status: 404, description: 'Business unit not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiUpdateBusinessUnit() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update business unit',
      description: 'Updates a business unit name, code, type, timezone, metadata, or active status.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Business unit ID' }),
    ApiBody({ type: UpdateBusinessUnitInternalDto }),
    ApiResponse({ status: 200, description: 'Business unit updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Business unit not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiSetBuLocks() {
  return applyDecorators(
    ApiOperation({
      summary: 'Replace business unit feature locks',
      description:
        'Replaces the business unit feature lock deny-list (restriction within the plan ceiling; out-of-plan locks are inert). Null inherits the full plan. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Business unit ID' }),
    ApiBody({ type: SetBuLocksInternalDto }),
    ApiResponse({ status: 200, description: 'Feature locks updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Business unit not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiDeleteBusinessUnit() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete business unit',
      description:
        'Deletes a business unit. Fails if the unit has child business units — they must be removed or reassigned first.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Business unit ID' }),
    ApiResponse({ status: 200, description: 'Business unit deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Business unit has children.' }),
    ApiResponse({ status: 404, description: 'Business unit not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

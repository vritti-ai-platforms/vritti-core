import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { BusinessUnitDto } from '../dto/entity/business-unit.dto';
import { CreateBusinessUnitWebhookDto } from '../dto/request/create-business-unit-webhook.dto';
import { SetBuLocksWebhookDto } from '../dto/request/set-bu-locks-webhook.dto';
import { UpdateBusinessUnitWebhookDto } from '../dto/request/update-business-unit-webhook.dto';

export function ApiCreateBusinessUnitWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create business unit',
      description:
        'Creates a new business unit for an organization. Computes depth and materialized path from the parent. Requires X-Webhook-Secret header.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiBody({ type: CreateBusinessUnitWebhookDto }),
    ApiResponse({ status: 201, description: 'Business unit created successfully.', type: BusinessUnitDto }),
    ApiResponse({ status: 400, description: 'Invalid input data or validation error.' }),
    ApiResponse({ status: 404, description: 'Parent business unit not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

export function ApiListBusinessUnitsWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'List business units',
      description:
        'Returns a flat list of all business units for an organization, ordered by depth and sort order. Client builds the tree from parentId.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiQuery({ name: 'orgId', description: 'Organization ID', required: true }),
    ApiResponse({ status: 200, description: 'Business units retrieved successfully.', type: [BusinessUnitDto] }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

export function ApiGetBusinessUnitWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get business unit with subtree',
      description: 'Returns a business unit and all its descendants using materialized path prefix matching.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiParam({ name: 'id', description: 'Business unit ID' }),
    ApiResponse({ status: 200, description: 'Business unit subtree retrieved successfully.', type: [BusinessUnitDto] }),
    ApiResponse({ status: 404, description: 'Business unit not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

export function ApiUpdateBusinessUnitWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update business unit',
      description: 'Updates a business unit name, code, type, timezone, metadata, or active status.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiParam({ name: 'id', description: 'Business unit ID' }),
    ApiBody({ type: UpdateBusinessUnitWebhookDto }),
    ApiResponse({ status: 200, description: 'Business unit updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Business unit not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

export function ApiSetBuLocksWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Replace business unit feature locks',
      description:
        'Replaces the business unit feature lock deny-list (restriction within the plan ceiling; out-of-plan locks are inert). Null inherits the full plan. Requires X-Webhook-Secret header.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiParam({ name: 'id', description: 'Business unit ID' }),
    ApiBody({ type: SetBuLocksWebhookDto }),
    ApiResponse({ status: 200, description: 'Feature locks updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Business unit not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

export function ApiDeleteBusinessUnitWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete business unit',
      description:
        'Deletes a business unit. Fails if the unit has child business units — they must be removed or reassigned first.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiParam({ name: 'id', description: 'Business unit ID' }),
    ApiResponse({ status: 200, description: 'Business unit deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Business unit has children.' }),
    ApiResponse({ status: 404, description: 'Business unit not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

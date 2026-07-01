import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { CreateRoleWebhookDto } from '../dto/request/create-role-webhook.dto';
import { ProvisionRolesWebhookDto } from '../dto/request/provision-roles-webhook.dto';
import { UpdateRoleWebhookDto } from '../dto/request/update-role-webhook.dto';

export function ApiProvisionRolesWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Bulk provision roles',
      description:
        'Receives bulk role provisioning from cloud-server. Creates roles rows with features stored as a jsonb array. Requires X-Webhook-Secret header.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiBody({ type: ProvisionRolesWebhookDto }),
    ApiResponse({ status: 201, description: 'Roles provisioned successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data or validation error.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

export function ApiListRolesWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'List roles for organization',
      description: 'Returns all roles for an organization with their feature counts. Protected by webhook secret.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiQuery({ name: 'orgId', description: 'Organization ID', required: true }),
    ApiResponse({ status: 200, description: 'Roles retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

export function ApiCreateRoleWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a single role',
      description:
        'Creates a new role with validated features. Features must belong to the organization. Validates name uniqueness within the org.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiBody({ type: CreateRoleWebhookDto }),
    ApiResponse({ status: 201, description: 'Role created successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid features or validation error.' }),
    ApiResponse({ status: 409, description: 'Role name already exists.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

export function ApiUpdateRoleWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a role',
      description:
        'Updates role metadata (name, description). If features are provided, replaces the features jsonb array.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiParam({ name: 'id', description: 'Role ID' }),
    ApiBody({ type: UpdateRoleWebhookDto }),
    ApiResponse({ status: 200, description: 'Role updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Role not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

export function ApiRolesForBuWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'List all roles for a business unit',
      description: "Returns every role in the business unit's organization.",
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiQuery({ name: 'buId', description: 'Business unit ID', required: true }),
    ApiResponse({ status: 200, description: 'Roles retrieved successfully.' }),
    ApiResponse({ status: 404, description: 'Business unit not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

export function ApiDeleteRoleWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a role',
      description:
        'Deletes a role. Cascade delete removes associated user_role_assignments automatically.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiParam({ name: 'id', description: 'Role ID' }),
    ApiResponse({ status: 200, description: 'Role deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Role not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

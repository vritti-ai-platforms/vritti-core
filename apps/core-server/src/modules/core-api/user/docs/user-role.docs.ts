import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { AssignRoleWebhookDto } from '../dto/request/assign-role-webhook.dto';

export function ApiAssignRoleWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Assign role to user',
      description:
        'Assigns an organization role to a user within a specific business unit. Validates the role and business unit exist, and checks for duplicate assignments.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiParam({ name: 'id', description: 'User ID' }),
    ApiBody({ type: AssignRoleWebhookDto }),
    ApiResponse({ status: 201, description: 'Role assigned successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Role or business unit not found.' }),
    ApiResponse({ status: 409, description: 'Duplicate role assignment.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

export function ApiListUserRolesWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'List user role assignments',
      description: 'Returns all role assignments for a user, including role and business unit names via joins.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiParam({ name: 'id', description: 'User ID' }),
    ApiResponse({ status: 200, description: 'Role assignments retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

export function ApiRemoveRoleAssignmentWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove role assignment',
      description: 'Removes a specific role assignment from a user.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiParam({ name: 'id', description: 'User ID' }),
    ApiParam({ name: 'assignmentId', description: 'Role assignment ID' }),
    ApiResponse({ status: 200, description: 'Role assignment removed successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Role assignment not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

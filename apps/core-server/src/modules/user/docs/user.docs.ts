import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { UserDto } from '../dto/entity/user.dto';
import { CreateUserWebhookDto } from '../dto/request/create-user-webhook.dto';
import { UpdateUserWebhookDto } from '../dto/request/update-user-webhook.dto';

export function ApiCreateUserWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create or update user from webhook',
      description:
        'Receives a user creation event from cloud-server and upserts the user in the nexus database. Idempotent — safe to call multiple times for the same externalId.',
    }),
    ApiBody({ type: CreateUserWebhookDto }),
    ApiResponse({ status: 201, description: 'User created or updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data or validation error.' }),
  );
}

export function ApiGetUsersWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get portal users by org',
      description: 'Returns all users for the given organisation. Protected by webhook secret.',
    }),
    ApiQuery({ name: 'orgId', description: 'Organisation ID', required: true }),
    ApiResponse({ status: 200, description: 'Users retrieved successfully.', type: [UserDto] }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

export function ApiUpdateUserWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update portal user',
      description: 'Updates a portal user role, status or name. Protected by webhook secret.',
    }),
    ApiParam({ name: 'id', description: 'User ID' }),
    ApiBody({ type: UpdateUserWebhookDto }),
    ApiResponse({ status: 200, description: 'User updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'User not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

export function ApiResendInviteWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Resend invitation email',
      description:
        'Resends the invitation email to a PENDING user with a fresh SET_PASSWORD token. Deletes all existing sessions before creating a new one.',
    }),
    ApiParam({ name: 'id', description: 'User ID' }),
    ApiResponse({ status: 200, description: 'Invitation resent successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'User is not in PENDING status or has already set a password.' }),
    ApiResponse({ status: 404, description: 'User not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

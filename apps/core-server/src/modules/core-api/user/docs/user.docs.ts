import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { MobileLookupResponseDto } from '../../auth/mobile/dto/response/mobile-lookup-response.dto';
import { CreateUserWebhookDto } from '../dto/request/create-user-webhook.dto';
import { UpdateUserWebhookDto } from '../dto/request/update-user-webhook.dto';
import { UsersTableResponseDto } from '../dto/response/users-table-response.dto';

export function ApiGetOrganizationsByEmail() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lookup organizations by email',
      description: 'Returns all organizations associated with the given email address. Public endpoint used by the mobile app before login.',
    }),
    ApiQuery({ name: 'email', description: 'User email address', required: true }),
    ApiResponse({ status: 200, description: 'Organizations retrieved successfully.', type: MobileLookupResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid email address.' }),
  );
}

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
      description:
        'Returns paginated, filtered, and sorted users for the given organisation. Filter/sort/search state is passed as JSON query params from cloud-server. Protected by webhook secret.',
    }),
    ApiQuery({ name: 'orgId', description: 'Organisation ID', required: true }),
    ApiQuery({ name: 'filters', description: 'JSON-stringified FilterCondition[]', required: false }),
    ApiQuery({ name: 'search', description: 'JSON-stringified SearchState', required: false }),
    ApiQuery({ name: 'sort', description: 'JSON-stringified SortCondition[]', required: false }),
    ApiQuery({ name: 'limit', description: 'Page size', required: false, type: Number }),
    ApiQuery({ name: 'offset', description: 'Page offset', required: false, type: Number }),
    ApiResponse({ status: 200, description: 'Users retrieved successfully.', type: UsersTableResponseDto }),
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

import { AssignRoleInternalDto } from '@domain/user-role/dto/request/assign-role-internal.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/database';

export function ApiAssignRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Assign role to user',
      description:
        'Assigns an organization role to a user within a specific sites. Validates the role and sites exist, and checks for duplicate assignments.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'User ID' }),
    ApiBody({ type: AssignRoleInternalDto }),
    ApiResponse({ status: 201, description: 'Role assigned successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Role or sites not found.' }),
    ApiResponse({ status: 409, description: 'Duplicate role assignment.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiListUserRoles() {
  return applyDecorators(
    ApiOperation({
      summary: 'List user role assignments',
      description: 'Returns all role assignments for a user, including role and sites names via joins.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'User ID' }),
    ApiResponse({ status: 200, description: 'Role assignments retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiRemoveRoleAssignment() {
  return applyDecorators(
    ApiOperation({
      summary: 'Remove role assignment',
      description: 'Removes a specific role assignment from a user.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'User ID' }),
    ApiParam({ name: 'assignmentId', description: 'Role assignment ID' }),
    ApiResponse({ status: 200, description: 'Role assignment removed successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Role assignment not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { CreateRoleInternalDto } from '../dto/request/create-role-internal.dto';
import { ProvisionRolesInternalDto } from '../dto/request/provision-roles-internal.dto';
import { UpdateRoleInternalDto } from '../dto/request/update-role-internal.dto';

export function ApiProvisionRoles() {
  return applyDecorators(
    ApiOperation({
      summary: 'Bulk provision roles',
      description:
        'Receives bulk role provisioning from cloud-server. Creates roles rows with features stored as a jsonb array. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiBody({ type: ProvisionRolesInternalDto }),
    ApiResponse({ status: 201, description: 'Roles provisioned successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid input data or validation error.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiListRoles() {
  return applyDecorators(
    ApiOperation({
      summary: 'List roles for organization',
      description: 'Returns all roles for an organization with their feature counts. Protected by request signature.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiQuery({ name: 'orgId', description: 'Organization ID', required: true }),
    ApiResponse({ status: 200, description: 'Roles retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiCreateRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a single role',
      description:
        'Creates a new role with validated features. Features must belong to the organization. Validates name uniqueness within the org.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiBody({ type: CreateRoleInternalDto }),
    ApiResponse({ status: 201, description: 'Role created successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid features or validation error.' }),
    ApiResponse({ status: 409, description: 'Role name already exists.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiUpdateRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a role',
      description:
        'Updates role metadata (name, description). If features are provided, replaces the features jsonb array.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Role ID' }),
    ApiBody({ type: UpdateRoleInternalDto }),
    ApiResponse({ status: 200, description: 'Role updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Role not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiRolesForSite() {
  return applyDecorators(
    ApiOperation({
      summary: 'List all roles for a site',
      description: "Returns every role in the site's organization.",
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiQuery({ name: 'siteId', description: 'Site ID', required: true }),
    ApiResponse({ status: 200, description: 'Roles retrieved successfully.' }),
    ApiResponse({ status: 404, description: 'Site not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiDeleteRole() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a role',
      description: 'Deletes a role. Cascade delete removes associated user_role_assignments automatically.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Role ID' }),
    ApiResponse({ status: 200, description: 'Role deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Role not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiRolesForTarget() {
  return applyDecorators(
    ApiOperation({
      summary: 'List roles assignable at a target',
      description:
        "Returns the org's roles whose template scope matches the target type, plus SITE-scoped templates and custom roles. Org resolved from the signed x-org-id header.",
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiQuery({ name: 'targetType', description: 'Target type: ORG, LE, SITE_GROUP, or SITE', required: true }),
    ApiQuery({ name: 'targetId', description: 'Target ID (required for SITE targets)', required: false }),
    ApiResponse({ status: 200, description: 'Roles retrieved successfully.' }),
    ApiResponse({ status: 400, description: 'Invalid target type.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

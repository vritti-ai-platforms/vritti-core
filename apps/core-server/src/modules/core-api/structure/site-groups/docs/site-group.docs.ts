import { SiteGroupDto } from '@domain/site-group/dto/entity/site-group.dto';
import { CreateSiteGroupInternalDto } from '@domain/site-group/dto/request/create-site-group-internal.dto';
import { ReorderSiteGroupsInternalDto } from '@domain/site-group/dto/request/reorder-site-groups-internal.dto';
import { ReparentSiteGroupInternalDto } from '@domain/site-group/dto/request/reparent-site-group-internal.dto';
import { UpdateSiteGroupInternalDto } from '@domain/site-group/dto/request/update-site-group-internal.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { SetFeatureLocksInternalDto } from '../../dto/request/set-feature-locks-internal.dto';
import { FeatureLocksResponseDto } from '../../dto/response/feature-locks-response.dto';
import { OrgStructureSelectResponseDto } from '../../dto/response/org-structure-select-response.dto';

export function ApiSelectSiteGroups() {
  return applyDecorators(
    ApiOperation({
      summary: 'Select site groups',
      description:
        'Returns the organization site groups as select options (value=id, label=name, description=code), filtered by search and an optional subtree exclusion. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiHeader({ name: 'x-org-id', description: 'Organization ID scoping the request', required: true }),
    ApiResponse({
      status: 200,
      description: 'Site group options retrieved successfully.',
      type: OrgStructureSelectResponseDto,
    }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiCreateSiteGroup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create site group',
      description:
        'Creates a new site group for an organization. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiBody({ type: CreateSiteGroupInternalDto }),
    ApiResponse({ status: 201, description: 'Site group created successfully.', type: SiteGroupDto }),
    ApiResponse({ status: 400, description: 'Invalid input data or validation error.' }),
    ApiResponse({ status: 409, description: 'Duplicate site group code.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiListSiteGroups() {
  return applyDecorators(
    ApiOperation({
      summary: 'List site groups',
      description:
        'Returns a flat list of all site groups for an organization. Client builds the tree from parentId. Org resolved from the signed x-org-id header.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiHeader({ name: 'x-org-id', description: 'Organization ID scoping the request', required: true }),
    ApiResponse({ status: 200, description: 'Site groups retrieved successfully.', type: [SiteGroupDto] }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiGetSiteGroup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get site group',
      description: 'Returns a single site group by ID.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Site group ID' }),
    ApiResponse({ status: 200, description: 'Site group retrieved successfully.', type: SiteGroupDto }),
    ApiResponse({ status: 404, description: 'Site group not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiUpdateSiteGroup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update site group',
      description: 'Updates a site group name, code, parent, or active status. Parent changes are cycle-checked.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Site group ID' }),
    ApiBody({ type: UpdateSiteGroupInternalDto }),
    ApiResponse({ status: 200, description: 'Site group updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid parent (missing, foreign, or cycle).' }),
    ApiResponse({ status: 404, description: 'Site group not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiReorderSiteGroups() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reorder site groups',
      description:
        'Reassigns sort order for a batch of sibling site groups in their new left-to-right order. Every id must belong to the organization.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiBody({ type: ReorderSiteGroupsInternalDto }),
    ApiResponse({ status: 200, description: 'Site groups reordered successfully.', type: SuccessResponseDto }),
    ApiResponse({
      status: 400,
      description: 'One or more site groups do not exist or belong to another organization.',
    }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiReparentSiteGroup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Reparent site group',
      description:
        'Nests a site group under a new parent (null detaches it to root) and appends it to the end of that parent. The new parent must belong to the organization and cannot be the group itself or one of its descendants.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'groupId', description: 'Site group ID' }),
    ApiBody({ type: ReparentSiteGroupInternalDto }),
    ApiResponse({ status: 200, description: 'Site group reparented successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 400, description: 'Invalid parent (missing, foreign, or cycle).' }),
    ApiResponse({ status: 404, description: 'Site group not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiDeleteSiteGroup() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete site group',
      description: 'Deletes a site group. Fails if the group has child groups or member sites.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Site group ID' }),
    ApiResponse({ status: 200, description: 'Site group deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 409, description: 'Site group has child groups or member sites.' }),
    ApiResponse({ status: 404, description: 'Site group not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiGetSiteGroupLocks() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get site group feature locks',
      description:
        'Returns the stored site group feature lock deny-list (null = inherit the full plan). Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Site group ID' }),
    ApiResponse({ status: 200, description: 'Feature locks returned successfully.', type: FeatureLocksResponseDto }),
    ApiResponse({ status: 404, description: 'Site group not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiSetSiteGroupLocks() {
  return applyDecorators(
    ApiOperation({
      summary: 'Replace site group feature locks',
      description:
        'Replaces the site group feature lock deny-list (restriction within the plan ceiling; out-of-plan locks are inert). Null inherits the full plan. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Site group ID' }),
    ApiBody({ type: SetFeatureLocksInternalDto }),
    ApiResponse({ status: 200, description: 'Feature locks updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Site group not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiListSiteGroupRoleAssignments() {
  return applyDecorators(
    ApiOperation({
      summary: 'List site group role assignments',
      description: 'Returns all role assignments directly targeting a site group with user and role names.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Site group ID' }),
    ApiResponse({ status: 200, description: 'Role assignments retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

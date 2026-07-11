import { SiteDto } from '@domain/site/dto/entity/site.dto';
import { CreateSiteInternalDto } from '@domain/site/dto/request/create-site-internal.dto';
import { UpdateSiteInternalDto } from '@domain/site/dto/request/update-site-internal.dto';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { SetFeatureLocksInternalDto } from '../../dto/request/set-feature-locks-internal.dto';

export function ApiCreateSite() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create site',
      description:
        'Creates a new site for an organization. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiBody({ type: CreateSiteInternalDto }),
    ApiResponse({ status: 201, description: 'Site created successfully.', type: SiteDto }),
    ApiResponse({ status: 400, description: 'Invalid input data or validation error.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiListSites() {
  return applyDecorators(
    ApiOperation({
      summary: 'List sites',
      description: 'Returns a flat list of all sites for an organization, ordered by sort order.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiQuery({ name: 'orgId', description: 'Organization ID', required: true }),
    ApiResponse({ status: 200, description: 'Sites retrieved successfully.', type: [SiteDto] }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiGetSite() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get site',
      description: 'Returns a single site by ID.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Site ID' }),
    ApiResponse({ status: 200, description: 'Site retrieved successfully.', type: SiteDto }),
    ApiResponse({ status: 404, description: 'Site not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiUpdateSite() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update site',
      description: 'Updates a site name, code, type, group, timezone, metadata, links, or active status.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Site ID' }),
    ApiBody({ type: UpdateSiteInternalDto }),
    ApiResponse({ status: 200, description: 'Site updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Site not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiSetSiteLocks() {
  return applyDecorators(
    ApiOperation({
      summary: 'Replace site feature locks',
      description:
        'Replaces the site feature lock deny-list (restriction within the plan ceiling; out-of-plan locks are inert). Null inherits the full plan. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Site ID' }),
    ApiBody({ type: SetFeatureLocksInternalDto }),
    ApiResponse({ status: 200, description: 'Feature locks updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Site not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiDeleteSite() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete site',
      description: 'Deletes a site.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'id', description: 'Site ID' }),
    ApiResponse({ status: 200, description: 'Site deleted successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Site not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

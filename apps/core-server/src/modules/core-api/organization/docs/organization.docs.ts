import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk/database';
import { SetFeatureLocksInternalDto } from '../../structure/dto/request/set-feature-locks-internal.dto';
import { FeatureLocksResponseDto } from '../../structure/dto/response/feature-locks-response.dto';
import { OrganizationDto } from '../dto/entity/organization.dto';
import { CreateOrganizationInternalDto } from '../dto/request/create-organization-internal.dto';
import { ReceiveEntitlementInternalDto } from '../dto/request/receive-entitlement-internal.dto';

export function ApiCreateOrganization() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create organization from cloud',
      description:
        'Receives an organization creation event from cloud-server. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiBody({ type: CreateOrganizationInternalDto }),
    ApiResponse({ status: 201, description: 'Organization created successfully.', type: OrganizationDto }),
    ApiResponse({ status: 400, description: 'Invalid input data or validation error.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiReceiveEntitlement() {
  return applyDecorators(
    ApiOperation({
      summary: 'Receive organization entitlement',
      description:
        'Receives the signed plan entitlement (planCode + businessCode) from cloud-server, verifies its Ed25519 signature and org/deployment binding, and stores it. Older issuedAt values are ignored (replay guard). Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiParam({ name: 'orgId', description: 'Organization ID' }),
    ApiBody({ type: ReceiveEntitlementInternalDto }),
    ApiResponse({ status: 200, description: 'Entitlement stored successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 403, description: 'Invalid signature, org mismatch, or deployment binding failure.' }),
    ApiResponse({ status: 404, description: 'Organization not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiGetOrganizationLocks() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get organization feature locks',
      description:
        'Returns the stored organization feature lock deny-list (null = inherit the full plan). Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiHeader({ name: 'x-org-id', description: 'Target organization ID (signed)', required: true }),
    ApiResponse({ status: 200, description: 'Feature locks returned successfully.', type: FeatureLocksResponseDto }),
    ApiResponse({ status: 404, description: 'Organization not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

export function ApiSetOrganizationLocks() {
  return applyDecorators(
    ApiOperation({
      summary: 'Replace organization feature locks',
      description:
        'Replaces the organization feature lock deny-list (restriction within the plan ceiling; out-of-plan locks are inert). Null inherits the full plan. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiHeader({ name: 'x-org-id', description: 'Target organization ID (signed)', required: true }),
    ApiBody({ type: SetFeatureLocksInternalDto }),
    ApiResponse({ status: 200, description: 'Feature locks updated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 404, description: 'Organization not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

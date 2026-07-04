import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
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

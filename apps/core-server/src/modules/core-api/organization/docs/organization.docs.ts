import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { OrganizationDto } from '../dto/entity/organization.dto';
import { CreateOrganizationWebhookDto } from '../dto/request/create-organization-webhook.dto';
import { ReceiveEntitlementWebhookDto } from '../dto/request/receive-entitlement-webhook.dto';

export function ApiCreateOrganizationWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create organization from webhook',
      description:
        'Receives an organization creation event from cloud-server. Requires X-Webhook-Secret header for authentication.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiBody({ type: CreateOrganizationWebhookDto }),
    ApiResponse({ status: 201, description: 'Organization created successfully.', type: OrganizationDto }),
    ApiResponse({ status: 400, description: 'Invalid input data or validation error.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

export function ApiReceiveEntitlementWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Receive organization entitlement',
      description:
        'Receives the signed plan entitlement (planCode + businessCode) from cloud-server, verifies its Ed25519 signature and org/deployment binding, and stores it. Older issuedAt values are ignored (replay guard). Requires X-Webhook-Secret header.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiParam({ name: 'orgId', description: 'Organization ID' }),
    ApiBody({ type: ReceiveEntitlementWebhookDto }),
    ApiResponse({ status: 200, description: 'Entitlement stored successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 403, description: 'Invalid signature, org mismatch, or deployment binding failure.' }),
    ApiResponse({ status: 404, description: 'Organization not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

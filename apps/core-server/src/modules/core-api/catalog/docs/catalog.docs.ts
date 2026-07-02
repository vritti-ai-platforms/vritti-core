import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { ReceiveCatalogWebhookDto } from '../dto/request/receive-catalog-webhook.dto';

export function ApiReceiveCatalogWebhook() {
  return applyDecorators(
    ApiOperation({
      summary: 'Receive catalog license',
      description:
        'Receives the signed version snapshot (catalog license) from cloud-server, verifies its Ed25519 signature and snapshot hash, stores it append-only, and activates it. Idempotent by snapshot hash. Requires X-Webhook-Secret header.',
    }),
    ApiHeader({ name: 'X-Webhook-Secret', description: 'Webhook authentication secret', required: true }),
    ApiBody({ type: ReceiveCatalogWebhookDto }),
    ApiResponse({ status: 200, description: 'Catalog verified and activated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 403, description: 'Invalid signature, hash mismatch, or deployment binding failure.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing webhook secret.' }),
  );
}

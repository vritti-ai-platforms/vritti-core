import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessResponseDto } from '@vritti/api-sdk';
import { ReceiveCatalogInternalDto } from '../dto/request/receive-catalog-internal.dto';

export function ApiReceiveCatalog() {
  return applyDecorators(
    ApiOperation({
      summary: 'Receive catalog license',
      description:
        'Receives the signed version snapshot (catalog license) from cloud-server, verifies its Ed25519 signature and snapshot hash, stores it append-only, and activates it. Idempotent by snapshot hash. Requires Ed25519 signature headers (x-timestamp, x-signature).',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiBody({ type: ReceiveCatalogInternalDto }),
    ApiResponse({ status: 200, description: 'Catalog verified and activated successfully.', type: SuccessResponseDto }),
    ApiResponse({ status: 403, description: 'Invalid signature, hash mismatch, or deployment binding failure.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

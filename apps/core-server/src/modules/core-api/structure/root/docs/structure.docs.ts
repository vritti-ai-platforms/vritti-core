import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StructureResponseDto } from '../../dto/response/structure-response.dto';

export function ApiGetStructure() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get organization structure',
      description:
        'Returns the organization with its legal entities, tax registrations, and sites as a single aggregate. Requires Ed25519 signature headers (x-timestamp, x-signature).',
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
      description: 'Organization structure retrieved successfully.',
      type: StructureResponseDto,
    }),
    ApiResponse({ status: 404, description: 'Organization not found.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

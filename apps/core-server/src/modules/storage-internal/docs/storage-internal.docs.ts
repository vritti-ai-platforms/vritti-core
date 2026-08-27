import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrgStorageBodyDto } from '../dto/request/org-storage-body.dto';
import { OrgStorageResponseDto } from '../dto/response/org-storage-response.dto';

// Every signed-internal endpoint carries the same Ed25519 signature headers, so they are documented once
const SIGNATURE_HEADERS = [
  ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
  ApiHeader({
    name: 'x-signature',
    description: 'Ed25519 signature of the canonical request (base64)',
    required: true,
  }),
];

export function ApiGetOrgStorage() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get org storage descriptor (signed)',
      description:
        "Returns an organization's full object-storage descriptor (provider, account, buckets, public URL, and the " +
        'S3 credential scoped to those buckets) for cloud-server, which has no core session. The descriptor is ' +
        'provisioned by the control plane and read straight off the org row; the secret is returned in whatever form ' +
        'the writer stored it. The owner (org subdomain) is supplied by the trusted signed caller. Requires Ed25519 ' +
        'signature headers (x-timestamp, x-signature).',
    }),
    ...SIGNATURE_HEADERS,
    ApiBody({ type: OrgStorageBodyDto }),
    ApiResponse({
      status: 200,
      description: 'Org storage descriptor retrieved successfully.',
      type: OrgStorageResponseDto,
    }),
    ApiResponse({ status: 400, description: 'Owner is missing or invalid.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
    ApiResponse({ status: 403, description: 'Signature verification failed.' }),
    ApiResponse({ status: 404, description: 'No organization matches the supplied subdomain.' }),
  );
}

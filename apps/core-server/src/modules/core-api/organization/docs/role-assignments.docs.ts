import { applyDecorators } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiListOrgRoleAssignments() {
  return applyDecorators(
    ApiOperation({
      summary: 'List org-wide role assignments',
      description:
        'Returns all role assignments with no site, site group, or legal entity target — org-wide assignments — with user and role names. Org resolved from the signed x-org-id header.',
    }),
    ApiHeader({ name: 'x-timestamp', description: 'Unix seconds when the request was signed', required: true }),
    ApiHeader({
      name: 'x-signature',
      description: 'Ed25519 signature of the canonical request (base64)',
      required: true,
    }),
    ApiResponse({ status: 200, description: 'Role assignments retrieved successfully.' }),
    ApiResponse({ status: 401, description: 'Invalid or missing request signature.' }),
  );
}

import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import { getRequest } from '@/utils/request-context';

// Extracts the organization ID from the x-org-id header on signed internal requests
export const OrgIdHeader = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const header = getRequest(ctx).headers['x-org-id'];
  const orgId = Array.isArray(header) ? header[0] : header;

  if (!orgId) {
    throw new BadRequestException({
      label: 'Missing Org Header',
      detail: 'Internal requests must include the x-org-id header.',
    });
  }

  return orgId;
});

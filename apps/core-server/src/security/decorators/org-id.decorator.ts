import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getRequest } from '@/utils/request-context';

// Extracts organizationId from request.sessionInfo (set via JWT metadata)
export const OrgId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const orgId = getRequest(ctx).sessionInfo?.organizationId;

  if (!orgId) {
    throw new Error('Organization ID not found on request. Ensure route is protected by auth guard.');
  }

  return orgId;
});

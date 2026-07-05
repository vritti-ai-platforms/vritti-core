import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getRequest } from '@/utils/request-context';

// Extracts subdomain from request.sessionInfo (set from request host in onAuthenticated)
export const OrgSubdomain = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const subdomain = getRequest(ctx).sessionInfo?.subdomain;

  if (!subdomain) {
    throw new Error('Subdomain not found on request. Ensure route is protected by auth guard.');
  }

  return subdomain;
});

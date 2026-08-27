import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getRequest } from '@/utils/request-context';

// Extracts subdomain from request.auth — session callers only; apps and cloud have no host to check
export const OrgSubdomain = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const auth = getRequest(ctx).auth;
  const subdomain = auth?.kind === 'session' ? auth.subdomain : undefined;

  if (!subdomain) {
    throw new Error('Subdomain not found on request. Ensure route is protected by auth guard.');
  }

  return subdomain;
});

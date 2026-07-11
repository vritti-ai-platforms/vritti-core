import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getRequest } from '@/utils/request-context';

// Extracts siteId from request.sessionInfo (set via x-site-id header in onAuthenticated)
export const SiteId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  return getRequest(ctx).sessionInfo?.siteId;
});

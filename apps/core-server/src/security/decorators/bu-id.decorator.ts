import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getRequest } from '@/utils/request-context';

// Extracts buId from request.sessionInfo (set via x-bu-id header in onAuthenticated)
export const BuId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  return getRequest(ctx).sessionInfo?.buId;
});

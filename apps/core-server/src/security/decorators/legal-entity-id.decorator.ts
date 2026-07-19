import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getRequest } from '@/utils/request-context';

// Extracts legalEntityId from request.sessionInfo (set via x-le-id header in onAuthenticated)
export const LegalEntityId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  return getRequest(ctx).sessionInfo?.legalEntityId;
});

import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getRequest } from '@/utils/request-context';

// The party a signed app request is acting for, or undefined when it named none — for operations a party is optional on
export const OptionalPartyId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  const auth = getRequest(ctx).auth;
  return auth?.kind === 'app' ? auth.partyId : undefined;
});

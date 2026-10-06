import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@vritti/api-sdk/exceptions';
import { getRequest } from '@/utils/request-context';

// The party a signed request is acting for
export const PartyId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const auth = getRequest(ctx).auth;

  if (auth?.kind !== 'app') {
    throw new UnauthorizedException({
      label: 'Not An App Request',
      detail: 'This operation requires an app credential.',
    });
  }

  if (!auth.partyId) {
    throw new UnauthorizedException({
      label: 'No Party',
      detail: 'Sign in before using this.',
    });
  }

  return auth.partyId;
});

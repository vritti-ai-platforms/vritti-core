import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@vritti/api-sdk/exceptions';
import { getRequest } from '@/utils/request-context';

/**
 * The shopper a signed request is acting for.
 *
 * **This is the whole of the access control on a basket or a wishlist list.** Those operations
 * name no id of their own — there is no `cartId` argument to get wrong — so the party read here is
 * what decides whose rows are touched. It comes from `request.auth`, which `AppRequestResolver`
 * fills in only after checking the signature, and the party is *inside* that signature: an
 * `x-party-id` header swapped in transit changes the canonical and the request is refused.
 *
 * A resolver must therefore never accept a party as an argument. One that did would let any
 * storefront read any shopper's basket by sending a different id, and the signature would still
 * verify — because the caller really is that storefront, and it really did sign what it sent.
 *
 * Throws rather than returning undefined. A request with no party is an app acting for nobody, and
 * the shopper-scoped surface has nothing to answer: the storefront is meant to send visitors
 * through sign-in first, and a silent null here would be a basket belonging to no one.
 */
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
      label: 'No Shopper',
      detail: 'Sign in before using this.',
    });
  }

  return auth.partyId;
});

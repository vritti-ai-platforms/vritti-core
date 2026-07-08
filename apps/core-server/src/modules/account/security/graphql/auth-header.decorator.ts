import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getRequestFromContext } from '@vritti/api-sdk/context';

// Returns the raw Authorization header value (incl. "Bearer " prefix) across HTTP and GraphQL transports
export const AuthHeader = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  return getRequestFromContext(ctx).headers.authorization;
});

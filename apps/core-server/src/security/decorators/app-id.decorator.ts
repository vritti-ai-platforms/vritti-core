import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { getRequest } from '@/utils/request-context';

// Extracts the app credential's id from request.auth — only app-authenticated routes carry one
export const AppId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const auth = getRequest(ctx).auth;

  if (auth?.kind !== 'app') {
    throw new Error('App ID not found on request. Ensure route is guarded by @Require(AuthType.App).');
  }

  return auth.appId;
});

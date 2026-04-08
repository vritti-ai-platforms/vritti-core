import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

// Extracts subdomain from request.sessionInfo (set from request host in onAuthenticated)
export const OrgSubdomain = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    const subdomain = request.sessionInfo?.subdomain;

    if (!subdomain) {
      throw new Error('Subdomain not found on request. Ensure route is protected by auth guard.');
    }

    return subdomain;
  },
);

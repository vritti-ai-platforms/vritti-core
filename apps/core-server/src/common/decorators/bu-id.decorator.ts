import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

// Extracts buId from request.sessionInfo (set via x-bu-id header in onAuthenticated)
export const BuId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    return request.sessionInfo?.buId;
  },
);

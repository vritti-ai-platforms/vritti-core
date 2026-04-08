import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

// Extracts organizationId from request.sessionInfo (set via JWT metadata)
export const OrgId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    const orgId = request.sessionInfo?.organizationId;

    if (!orgId) {
      throw new Error('Organization ID not found on request. Ensure route is protected by auth guard.');
    }

    return orgId;
  },
);

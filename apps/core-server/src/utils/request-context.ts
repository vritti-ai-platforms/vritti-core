import type { ExecutionContext } from '@nestjs/common';
import { type GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import type { FastifyRequest } from 'fastify';

// Resolves the Fastify request across HTTP and GraphQL transports (GraphQL exposes it as context.req)
export function getRequest(context: ExecutionContext): FastifyRequest {
  if (context.getType<GqlContextType>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext().req;
  }
  return context.switchToHttp().getRequest<FastifyRequest>();
}

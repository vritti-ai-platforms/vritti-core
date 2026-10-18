import { Injectable } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { FastifyRequest } from 'fastify';

export interface NatsScope {
  orgId: string;
  siteId?: string | null;
  legalEntityId?: string | null;
}

// Sends NATS messages with an explicit workspace context, for work that runs outside a request (sweeps, workers) or
// must speak for a different site than the request did.
@Injectable()
export class ScopedNatsClientService {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly db: PrimaryDatabaseService,
  ) {}

  // Sends one message to a named microservice under the given scope
  async send<T>(scope: NatsScope, service: string, cmd: string, data?: object): Promise<T> {
    const request = {
      headers: {},
      auth: {
        kind: 'cloud',
        organizationId: scope.orgId,
        ...(scope.siteId ? { siteId: scope.siteId } : {}),
        ...(scope.legalEntityId ? { legalEntityId: scope.legalEntityId } : {}),
      },
    } as unknown as FastifyRequest;

    const contextId = ContextIdFactory.create();
    this.moduleRef.registerRequestByContextId(request, contextId);
    const client = await this.moduleRef.resolve(NatsClientService, contextId, { strict: false });

    return this.db.runWithRlsContext({ orgId: scope.orgId }, () => client.send<T>(service, cmd, data));
  }
}

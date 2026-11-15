import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';

export interface WorkspaceContext {
  legalEntityId?: string;
}

@Injectable()
export class WorkspaceContextService {
  private readonly storage = new AsyncLocalStorage<WorkspaceContext>();

  // Runs the rest of a request inside the workspace the user is working in
  run<T>(context: WorkspaceContext, fn: () => Promise<T>): Promise<T> {
    return this.storage.run(context, fn);
  }

  // Returns the legal entity the user is working in, from the x-le-id header
  get legalEntityId(): string | undefined {
    return this.storage.getStore()?.legalEntityId;
  }
}

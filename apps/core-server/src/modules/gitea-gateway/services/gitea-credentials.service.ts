import { Injectable } from '@nestjs/common';
import { ServiceUnavailableException } from '@vritti/api-sdk/exceptions';
import type { GiteaCredentials } from '@/db/schema';
import { GiteaCredentialsRepository, type GiteaCredentialsUpsert } from './gitea-credentials.repository';

// Fixed Gitea user the pull token belongs to — core does not resolve it from Gitea anymore
const PULL_USERNAME = 'gitea-core';

// Pull credential handed to the ws-agent so it can authenticate read:package image pulls
export interface GiteaPullCredential {
  registry: string;
  username: string;
  token: string;
}

// Reads the agent-owned singleton gitea_credentials row. Core is a pure reader here — the deployment
// agent provisions Gitea and writes/rotates the tokens. The row is cached in memory so this is not a DB
// hit per Gitea request; invalidate() drops the cache so an agent rotation is picked up without a
// restart (GiteaHttpService calls it after a 401).
@Injectable()
export class GiteaCredentialsService {
  private cached: Promise<GiteaCredentials> | null = null;

  constructor(private readonly repository: GiteaCredentialsRepository) {}

  // The base Gitea URL the agent provisioned
  async getBaseUrl(): Promise<string> {
    const row = await this.load();
    return this.require(row.baseUrl, 'base URL');
  }

  // The all-scopes admin PAT core authenticates every Gitea call with
  async getCoreToken(): Promise<string> {
    const row = await this.load();
    return this.require(row.coreToken, 'core token');
  }

  // The read:package pull credential served to the ws-agent, assembled from the DB row
  async getPullCred(): Promise<GiteaPullCredential> {
    const row = await this.load();
    const baseUrl = this.require(row.baseUrl, 'base URL');
    const token = this.require(row.pullToken, 'pull token');
    return { registry: new URL(baseUrl).host, username: PULL_USERNAME, token };
  }

  // Whether the agent has already fully provisioned the singleton row (all three fields present). Reads
  // the row directly (not the throwing cache) — this backs the agent's signed existence-probe, which
  // decides whether to mint, so it must answer plainly rather than raise ServiceUnavailable.
  async exists(): Promise<boolean> {
    const row = await this.repository.get();
    return Boolean(row?.baseUrl && row?.coreToken && row?.pullToken);
  }

  // Writes the agent-provisioned tokens into the singleton row, then drops the cache so the next read is fresh
  async replace(credentials: GiteaCredentialsUpsert): Promise<void> {
    await this.repository.upsert(credentials);
    this.invalidate();
  }

  // Drops the cached row so the next read reflects an agent rotation
  invalidate(): void {
    this.cached = null;
  }

  // Reads the singleton row once and caches it; a rejected read clears the cache so the next call retries
  private load(): Promise<GiteaCredentials> {
    this.cached ??= this.fetch().catch((error: unknown) => {
      this.cached = null;
      throw error;
    });
    return this.cached;
  }

  // Fetches the row, throwing a clear ServiceUnavailable when the agent has not provisioned it yet
  private async fetch(): Promise<GiteaCredentials> {
    const row = await this.repository.get();
    if (!row) throw this.notProvisioned();
    return row;
  }

  // Returns the value or throws when the agent has not written this field yet
  private require(value: string | null, field: string): string {
    if (!value) throw this.notProvisioned(field);
    return value;
  }

  // A uniform "the agent hasn't provisioned Gitea yet" failure
  private notProvisioned(field = 'credentials'): ServiceUnavailableException {
    return new ServiceUnavailableException({
      label: 'Git Service Unavailable',
      detail: `The git service has not been provisioned yet (missing ${field}). Please try again shortly.`,
    });
  }
}

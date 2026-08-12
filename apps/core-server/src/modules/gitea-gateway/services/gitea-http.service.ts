import { Injectable } from '@nestjs/common';
import { NotFoundException, ServiceUnavailableException } from '@vritti/api-sdk/exceptions';
import axios, { type AxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { rethrowGiteaError } from '../gitea-error.util';
import { GiteaCredentialsService } from './gitea-credentials.service';

const REQUEST_TIMEOUT_MS = 10000;
const UNREACHABLE_DETAIL = 'Unable to reach the git service. Please try again later.';

// Gitea reports e.g. "1.24.7" or "1.26.0+dev-123-gabc" — only the leading numeric triple is comparable
const VERSION_PATTERN = /^(\d+)\.(\d+)(?:\.(\d+))?/;

// Parses a Gitea version into comparable segments; null when it doesn't look like a version at all
function parseVersion(version: string): [number, number, number] | null {
  const match = VERSION_PATTERN.exec(version.trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)];
}

// Negative when a < b, 0 when equal, positive when a > b. Unparseable versions sort as equal so an
// odd build string never trips a gate.
function compareVersions(a: string, b: string): number {
  const left = parseVersion(a);
  const right = parseVersion(b);
  if (!left || !right) return 0;
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
}

interface GiteaRequestOptions {
  params?: Record<string, unknown>;
  // Action job logs come back as text/plain even though the OpenAPI spec declares application/json,
  // so that call has to opt out of axios' JSON parsing
  responseType?: 'text';
}

// Marks a config that has already been retried once after a 401 so the response interceptor can't loop
type RetryableConfig = InternalAxiosRequestConfig & { _giteaRetried?: boolean };

// Single authenticated HTTP client for the Gitea instance. Owns transport concerns only — the base URL
// and admin token come from the agent-owned gitea_credentials row (via GiteaCredentialsService), the
// instance version probe, and funnelling every failure through one translation point. The token is the
// all-scopes admin PAT; core no longer mints anything, so there is no Basic-auth path.
@Injectable()
export class GiteaHttpService {
  private readonly client: AxiosInstance;
  // One probe per boot — the connected instance is fixed for the process, so it can't change under us
  private versionProbe?: Promise<string | null>;

  constructor(private readonly credentials: GiteaCredentialsService) {
    this.client = axios.create({ timeout: REQUEST_TIMEOUT_MS });

    // Base URL and admin token both live in the DB and can rotate, so they are resolved per request
    // rather than baked into axios.create — the credentials service caches them in memory.
    this.client.interceptors.request.use(async (config) => {
      const baseUrl = (await this.credentials.getBaseUrl()).replace(/\/+$/, '');
      config.baseURL = `${baseUrl}/api/v1`;
      config.headers.Authorization = `token ${await this.credentials.getCoreToken()}`;
      return config;
    });

    // A 401 means the agent rotated the admin token out from under us: drop the cached credentials and
    // retry the request once so the request interceptor re-reads the fresh token. A second 401 surfaces.
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const config = error.config as RetryableConfig | undefined;
        if (error.response?.status === 401 && config && !config._giteaRetried) {
          config._giteaRetried = true;
          this.credentials.invalidate();
          return this.client.request(config);
        }
        throw error;
      },
    );
  }

  // Builds per-request config
  private config(options?: GiteaRequestOptions) {
    return {
      params: options?.params,
      ...(options?.responseType ? { responseType: options.responseType } : {}),
    };
  }

  // Runs a Gitea call, translating every failure into a problem exception
  private async send<T>(fn: () => Promise<AxiosResponse<T>>): Promise<AxiosResponse<T>> {
    try {
      return await fn();
    } catch (error: unknown) {
      rethrowGiteaError(error, UNREACHABLE_DETAIL);
    }
  }

  // The connected instance's version, or null when it can't be determined. Never throws: a probe
  // failure must not be the reason a repository call fails.
  async getVersion(): Promise<string | null> {
    this.versionProbe ??= this.client
      .get<{ version?: string }>('/version')
      .then((response) => response.data?.version ?? null)
      .catch(() => null);
    return this.versionProbe;
  }

  // Rejects a call whose Gitea route only exists from `min` onwards. Gitea answers an unrouted path
  // with a bare 404, which reads as "missing data" — this turns that into an actionable problem.
  // An unknown version falls through to the real call rather than hard-failing.
  async requireMinVersion(min: string, feature: string): Promise<void> {
    const version = await this.getVersion();
    if (!version || compareVersions(version, min) >= 0) return;

    throw new ServiceUnavailableException({
      label: 'Git Service Outdated',
      detail: `${feature} requires Gitea ${min} or newer (connected: ${version}).`,
    });
  }

  // Sends a GET and returns the response body
  async get<T>(path: string, options?: GiteaRequestOptions): Promise<T> {
    return (await this.send(() => this.client.get<T>(path, this.config(options)))).data;
  }

  // Same as get(), but resolves to null when Gitea reports the resource does not exist
  async getOrNull<T>(path: string, options?: GiteaRequestOptions): Promise<T | null> {
    try {
      return await this.get<T>(path, options);
    } catch (error) {
      if (error instanceof NotFoundException) return null;
      throw error;
    }
  }

  // Sends a GET and returns the whole response — for endpoints whose total lives in a header
  async getWithHeaders<T>(path: string, options?: GiteaRequestOptions): Promise<AxiosResponse<T>> {
    return this.send(() => this.client.get<T>(path, this.config(options)));
  }

  // Sends a POST and returns the response body
  async post<T>(path: string, data?: unknown, options?: GiteaRequestOptions): Promise<T> {
    return (await this.send(() => this.client.post<T>(path, data, this.config(options)))).data;
  }

  // Sends a PUT and returns the response body
  async put<T>(path: string, data?: unknown, options?: GiteaRequestOptions): Promise<T> {
    return (await this.send(() => this.client.put<T>(path, data, this.config(options)))).data;
  }

  // Sends a DELETE and returns the response body
  async delete<T>(path: string, options?: GiteaRequestOptions): Promise<T> {
    return (await this.send(() => this.client.delete<T>(path, this.config(options)))).data;
  }
}

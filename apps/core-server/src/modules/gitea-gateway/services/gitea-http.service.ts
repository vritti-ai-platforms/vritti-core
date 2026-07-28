import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@vritti/api-sdk/exceptions';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { rethrowGiteaError } from '../gitea-error.util';

const REQUEST_TIMEOUT_MS = 10000;
const UNREACHABLE_DETAIL = 'Unable to reach the git service. Please try again later.';

interface GiteaRequestOptions {
  params?: Record<string, unknown>;
  // Performs the call on behalf of this Gitea user instead of the admin token owner
  sudo?: string;
}

// Single authenticated HTTP client for the Gitea instance. Owns transport concerns only —
// the admin token, the Sudo header, and funnelling every failure through one translation point.
@Injectable()
export class GiteaHttpService {
  private readonly client: AxiosInstance;

  constructor(configService: ConfigService) {
    const baseUrl = configService.getOrThrow<string>('GITEA_BASE_URL').replace(/\/+$/, '');

    this.client = axios.create({
      baseURL: `${baseUrl}/api/v1`,
      timeout: REQUEST_TIMEOUT_MS,
      headers: { Authorization: `token ${configService.getOrThrow<string>('GITEA_ADMIN_TOKEN')}` },
    });
  }

  // Builds per-request config, adding the Sudo header only when an actor is given
  private config(options?: GiteaRequestOptions) {
    return {
      params: options?.params,
      ...(options?.sudo ? { headers: { Sudo: options.sudo } } : {}),
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

  // Sends a PATCH and returns the response body
  async patch<T>(path: string, data?: unknown, options?: GiteaRequestOptions): Promise<T> {
    return (await this.send(() => this.client.patch<T>(path, data, this.config(options)))).data;
  }

  // Sends a DELETE and returns the response body
  async delete<T>(path: string, options?: GiteaRequestOptions): Promise<T> {
    return (await this.send(() => this.client.delete<T>(path, this.config(options)))).data;
  }
}

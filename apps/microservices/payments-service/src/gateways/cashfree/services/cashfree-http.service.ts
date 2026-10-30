import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { GATEWAY_HTTP_TIMEOUT_DEFAULT_MS } from '@/config/env.validation';
import {
  type CashfreeErrorContext,
  cashfreeErrorMessage,
  cashfreeErrorStatus,
  rethrowCashfreeError,
} from '../cashfree-error.util';

export interface CashfreeAuth {
  appId: string;
  secretKey: string;
}

export type CashfreeEnvironment = 'sandbox' | 'production';

export interface CashfreeRequestOptions {
  credentialField?: string;
  tolerate?: readonly number[];
  // Error messages Cashfree answers a lookup of something missing with: the call resolves null instead of throwing
  missingMessages?: readonly string[];
}

const HOSTS: Record<CashfreeEnvironment, string> = {
  sandbox: 'https://sandbox.cashfree.com/pg',
  production: 'https://api.cashfree.com/pg',
};
// Pinned so a Cashfree release never changes a response shape under the transport
const API_VERSION = '2023-08-01';
// Cashfree issues sandbox app ids with this prefix, so the keys alone say which host they belong to
const SANDBOX_APP_ID_PREFIX = 'TEST';
const UNREACHABLE_DETAIL = 'Unable to reach Cashfree. Please try again later.';

// HTTP client for Cashfree Payments (PG API). Owns transport concerns only — which host, which API version, how long
// to wait, how a failure maps to a problem — and stores no merchant credentials: the key pair arrives per call and is
// bound to that one request as headers, never to an interceptor, never to a log line.
@Injectable()
export class CashfreeHttpService {
  private readonly client: AxiosInstance;

  constructor(configService: ConfigService) {
    this.client = axios.create({
      timeout: configService.get<number>('GATEWAY_HTTP_TIMEOUT_MS') ?? GATEWAY_HTTP_TIMEOUT_DEFAULT_MS,
    });
  }

  // Sandbox keys go to the sandbox host, live keys to production
  environmentOf(auth: CashfreeAuth): CashfreeEnvironment {
    return auth.appId.startsWith(SANDBOX_APP_ID_PREFIX) ? 'sandbox' : 'production';
  }

  async get<T>(auth: CashfreeAuth, path: string, options?: CashfreeRequestOptions): Promise<T | null> {
    try {
      const response = await this.client.get<T>(this.url(auth, path), this.requestConfig(auth));
      return response.data;
    } catch (error) {
      return this.tolerateOrRethrow(error, options);
    }
  }

  async post<T>(
    auth: CashfreeAuth,
    path: string,
    data: Record<string, unknown>,
    options?: CashfreeRequestOptions,
  ): Promise<T | null> {
    try {
      const response = await this.client.post<T>(this.url(auth, path), data, this.requestConfig(auth));
      return response.data;
    } catch (error) {
      return this.tolerateOrRethrow(error, options);
    }
  }

  private url(auth: CashfreeAuth, path: string): string {
    return `${HOSTS[this.environmentOf(auth)]}${path}`;
  }

  // Binds the merchant's key pair and the pinned API version to this one request
  private requestConfig(auth: CashfreeAuth): AxiosRequestConfig {
    return {
      headers: {
        'x-client-id': auth.appId,
        'x-client-secret': auth.secretKey,
        'x-api-version': API_VERSION,
      },
    };
  }

  // Resolves null for a tolerated status or a missing entity, and rethrows anything else as a problem
  private tolerateOrRethrow(error: unknown, options?: CashfreeRequestOptions): null {
    const status = cashfreeErrorStatus(error);
    if (status !== undefined && options?.tolerate?.includes(status)) return null;
    if (status === 400 && options?.missingMessages?.includes(cashfreeErrorMessage(error) ?? '')) return null;
    rethrowCashfreeError(error, this.errorContext(options));
  }

  private errorContext(options?: CashfreeRequestOptions): CashfreeErrorContext {
    return { detail: UNREACHABLE_DETAIL, credentialField: options?.credentialField };
  }
}

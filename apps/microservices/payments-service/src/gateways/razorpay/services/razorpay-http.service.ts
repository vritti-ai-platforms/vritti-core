import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { GATEWAY_HTTP_TIMEOUT_DEFAULT_MS } from '@/config/env.validation';
import { type RazorpayErrorContext, rethrowRazorpayError } from '../razorpay-error.util';

export interface RazorpayAuth {
  keyId: string;
  keySecret: string;
}

export type RazorpayApiVersion = 'v1' | 'v2';

export interface RazorpayRequestOptions {
  credentialField?: string;
  version?: RazorpayApiVersion;
  fieldMap?: Readonly<Record<string, string>>;
}

const RAZORPAY_API_HOST = 'https://api.razorpay.com';
const DEFAULT_API_VERSION: RazorpayApiVersion = 'v1';
const UNREACHABLE_DETAIL = 'Unable to reach Razorpay. Please try again later.';

// HTTP client for the stock Razorpay REST API. HDFC's edition has its own copy under gateways/hdfc-razorpay, so a
// change here never reaches it. Owns transport concerns only — which host, how long to wait, how a
// failure maps to a problem — and stores no merchant credentials: the key pair arrives per call and
// is bound to that one request as basic auth, never to an interceptor, never to a log line.
@Injectable()
export class RazorpayHttpService {
  protected readonly client: AxiosInstance;

  constructor(configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.host(),
      timeout: configService.get<number>('GATEWAY_HTTP_TIMEOUT_MS') ?? GATEWAY_HTTP_TIMEOUT_DEFAULT_MS,
    });
  }

  // Issues a GET against the versioned path
  async get<T>(
    auth: RazorpayAuth,
    path: string,
    params?: Record<string, unknown>,
    options?: RazorpayRequestOptions,
  ): Promise<T> {
    try {
      const response = await this.client.get<T>(this.url(path, options), this.requestConfig(auth, { params }));
      return response.data;
    } catch (error) {
      this.rethrow(error, options);
    }
  }

  // Issues a POST against the versioned path
  async post<T>(
    auth: RazorpayAuth,
    path: string,
    data?: Record<string, unknown>,
    options?: RazorpayRequestOptions,
  ): Promise<T> {
    try {
      const response = await this.client.post<T>(this.url(path, options), data, this.requestConfig(auth, {}));
      return response.data;
    } catch (error) {
      this.rethrow(error, options);
    }
  }

  // Issues a PATCH against the versioned path
  async patch<T>(
    auth: RazorpayAuth,
    path: string,
    data?: Record<string, unknown>,
    options?: RazorpayRequestOptions,
  ): Promise<T> {
    try {
      const response = await this.client.patch<T>(this.url(path, options), data, this.requestConfig(auth, {}));
      return response.data;
    } catch (error) {
      this.rethrow(error, options);
    }
  }

  // This gateway's host, fixed in code
  protected host(): string {
    return RAZORPAY_API_HOST;
  }

  // Prefixes the API version — v1 for payments and orders, v2 for the Route account APIs
  protected url(path: string, options?: RazorpayRequestOptions): string {
    return `/${options?.version ?? DEFAULT_API_VERSION}${path}`;
  }

  // Binds the merchant's key pair as basic auth on this one request
  protected requestConfig(auth: RazorpayAuth, extra: AxiosRequestConfig): AxiosRequestConfig {
    return {
      ...extra,
      auth: { username: auth.keyId, password: auth.keySecret },
    };
  }

  // Maps a failed call to an RFC 9457 problem
  protected rethrow(error: unknown, options?: RazorpayRequestOptions): never {
    rethrowRazorpayError(error, this.errorContext(options));
  }

  // Builds the context the error mapper needs for this call
  protected errorContext(options?: RazorpayRequestOptions): RazorpayErrorContext {
    return { detail: UNREACHABLE_DETAIL, credentialField: options?.credentialField, fieldMap: options?.fieldMap };
  }
}

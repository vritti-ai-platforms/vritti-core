import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { GATEWAY_HTTP_TIMEOUT_DEFAULT_MS } from '@/config/env.validation';
import { type HdfcRazorpayErrorContext, rethrowHdfcRazorpayError } from '../hdfc-razorpay-error.util';

export interface HdfcRazorpayAuth {
  keyId: string;
  keySecret: string;
}

// The SmartHub kit documents v1 only
export type HdfcRazorpayApiVersion = 'v1';

export interface HdfcRazorpayRequestOptions {
  credentialField?: string;
  version?: HdfcRazorpayApiVersion;
  fieldMap?: Readonly<Record<string, string>>;
}

// The SmartHub kit names no dedicated host: every call goes to the stock Razorpay API with HDFC-issued keys
const HDFC_RAZORPAY_API_HOST = 'https://api.razorpay.com';
const DEFAULT_API_VERSION: HdfcRazorpayApiVersion = 'v1';
const UNREACHABLE_DETAIL = 'Unable to reach Razorpay. Please try again later.';

// HTTP client for HDFC Bank's edition of Razorpay (the SmartHub VAS integration kit). A full copy of the stock
// Razorpay client rather than a subclass, so HDFC can move to its own host, API versions or another provider
// without touching stock Razorpay. The kit names no dedicated host today, so calls go to the Razorpay API with
// HDFC-issued keys. Owns transport concerns only — which host, how long to wait, how a
// failure maps to a problem — and stores no merchant credentials: the key pair arrives per call and
// is bound to that one request as basic auth, never to an interceptor, never to a log line.
@Injectable()
export class HdfcRazorpayHttpService {
  protected readonly client: AxiosInstance;

  constructor(configService: ConfigService) {
    this.client = axios.create({
      baseURL: this.host(),
      timeout: configService.get<number>('GATEWAY_HTTP_TIMEOUT_MS') ?? GATEWAY_HTTP_TIMEOUT_DEFAULT_MS,
    });
  }

  // Issues a GET against the versioned path
  async get<T>(
    auth: HdfcRazorpayAuth,
    path: string,
    params?: Record<string, unknown>,
    options?: HdfcRazorpayRequestOptions,
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
    auth: HdfcRazorpayAuth,
    path: string,
    data?: Record<string, unknown>,
    options?: HdfcRazorpayRequestOptions,
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
    auth: HdfcRazorpayAuth,
    path: string,
    data?: Record<string, unknown>,
    options?: HdfcRazorpayRequestOptions,
  ): Promise<T> {
    try {
      const response = await this.client.patch<T>(this.url(path, options), data, this.requestConfig(auth, {}));
      return response.data;
    } catch (error) {
      this.rethrow(error, options);
    }
  }

  // HDFC's host, fixed in code
  protected host(): string {
    return HDFC_RAZORPAY_API_HOST;
  }

  // Prefixes the API version — HDFC's kit is v1 throughout
  protected url(path: string, options?: HdfcRazorpayRequestOptions): string {
    return `/${options?.version ?? DEFAULT_API_VERSION}${path}`;
  }

  // Binds the merchant's key pair as basic auth on this one request
  protected requestConfig(auth: HdfcRazorpayAuth, extra: AxiosRequestConfig): AxiosRequestConfig {
    return {
      ...extra,
      auth: { username: auth.keyId, password: auth.keySecret },
    };
  }

  // Maps a failed call to an RFC 9457 problem
  protected rethrow(error: unknown, options?: HdfcRazorpayRequestOptions): never {
    rethrowHdfcRazorpayError(error, this.errorContext(options));
  }

  // Builds the context the error mapper needs for this call
  protected errorContext(options?: HdfcRazorpayRequestOptions): HdfcRazorpayErrorContext {
    return { detail: UNREACHABLE_DETAIL, credentialField: options?.credentialField, fieldMap: options?.fieldMap };
  }
}

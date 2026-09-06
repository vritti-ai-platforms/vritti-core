import { createHmac } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import axios, { type AxiosInstance, isAxiosError } from 'axios';
import { rethrowMetaGraphError } from '../meta-graph-error.util';

const GRAPH_API_VERSION = 'v26.0';
const REQUEST_TIMEOUT_MS = 15000;
const UNREACHABLE_DETAIL = 'Unable to reach WhatsApp. Please try again later.';

// A rejected authorization code is not a stored-credential problem, so it must not surface as
// meta-graph-error.util's "reconnect the account" message — the fix is to re-run the popup
const SIGNUP_CODE_REJECTED = {
  label: 'Setup could not be completed',
  detail:
    'Meta rejected the setup code. It may have already been used or expired — please run the WhatsApp connect flow again.',
};

// What /debug_token reports about a token. `granular_scopes` is what makes a business integration
// token verifiable: each entry names a scope and the asset ids it was granted on.
export interface MetaGraphTokenDebug {
  app_id?: string;
  is_valid?: boolean;
  user_id?: string;
  scopes?: string[];
  granular_scopes?: { scope?: string; target_ids?: string[] }[];
  expires_at?: number;
  data_access_expires_at?: number;
}

// Single HTTP client for the Meta Graph API. Owns transport concerns only: every WABA carries its own
// access token (one row per organization), so the token is passed per call instead of living in an
// interceptor, and every failure funnels through one translation point.
@Injectable()
export class MetaGraphHttpService {
  private readonly client: AxiosInstance;
  private readonly appId: string;
  private readonly appSecret: string;

  // The proof is a pure function of the token, and tokens are long-lived and few (one per account),
  // so deriving it once per token keeps a HMAC off every request
  private readonly proofCache = new Map<string, string>();

  constructor(private readonly configService: ConfigService) {
    this.appId = this.configService.getOrThrow<string>('META_CLIENT_ID');
    this.appSecret = this.configService.getOrThrow<string>('META_CLIENT_SECRET');
    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${GRAPH_API_VERSION}`,
      timeout: REQUEST_TIMEOUT_MS,
    });
  }

  /**
   * Trades an Embedded Signup authorization code for a business integration system-user token.
   *
   * Deliberately not routed through `get()`: there is no token yet, so there is neither a bearer to
   * send nor anything to derive `appsecret_proof` from — the app id + secret pair IS the credential.
   */
  async exchangeCode(code: string): Promise<string> {
    try {
      const response = await this.client.get<{ access_token?: string }>('/oauth/access_token', {
        params: { client_id: this.appId, client_secret: this.appSecret, code },
      });
      // A 200 with no token has never been observed, but the field is optional in Meta's schema
      if (!response.data.access_token) throw new BadRequestException(SIGNUP_CODE_REJECTED);
      return response.data.access_token;
    } catch (error) {
      // Any 4xx is the code being spent, expired, or issued to a different app — all re-run-the-flow
      if (isAxiosError(error) && (error.response?.status ?? 500) < 500) {
        throw new BadRequestException(SIGNUP_CODE_REJECTED);
      }
      // Non-axios errors (the BadRequestException above included) are rethrown untouched
      rethrowMetaGraphError(error, UNREACHABLE_DETAIL);
    }
  }

  // Inspects a token with the app token (`{app-id}|{app-secret}`), which is how Meta authenticates
  // /debug_token — the token under inspection cannot vouch for itself
  async debugToken(token: string): Promise<MetaGraphTokenDebug> {
    try {
      const response = await this.client.get<{ data?: MetaGraphTokenDebug }>('/debug_token', {
        params: { input_token: token, access_token: `${this.appId}|${this.appSecret}` },
      });
      return response.data.data ?? {};
    } catch (error) {
      rethrowMetaGraphError(error, UNREACHABLE_DETAIL);
    }
  }

  async get<T>(accessToken: string, path: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.get<T>(path, {
        params: { ...params, appsecret_proof: this.appsecretProof(accessToken) },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      rethrowMetaGraphError(error, UNREACHABLE_DETAIL);
    }
  }

  async post<T>(accessToken: string, path: string, data?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.post<T>(path, data, {
        params: { appsecret_proof: this.appsecretProof(accessToken) },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      rethrowMetaGraphError(error, UNREACHABLE_DETAIL);
    }
  }

  async delete<T>(accessToken: string, path: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.delete<T>(path, {
        params: { ...params, appsecret_proof: this.appsecretProof(accessToken) },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return response.data;
    } catch (error) {
      rethrowMetaGraphError(error, UNREACHABLE_DETAIL);
    }
  }

  // Pushes a file through Meta's Resumable Upload API and returns the handle ("h") that
  // asset-consuming endpoints (e.g. profile_picture_handle) accept. The upload call itself uses
  // the OAuth authorization scheme and a file_offset header — that is Meta's spec, not Bearer.
  async uploadFile(accessToken: string, file: Buffer, mimeType: string): Promise<string> {
    try {
      const proof = this.appsecretProof(accessToken);

      const session = await this.client.post<{ id: string }>(
        `/app/uploads?file_length=${file.length}&file_type=${encodeURIComponent(mimeType)}`,
        undefined,
        { params: { appsecret_proof: proof }, headers: { Authorization: `Bearer ${accessToken}` } },
      );

      const uploaded = await this.client.post<{ h: string }>(`/${session.data.id}`, file, {
        params: { appsecret_proof: proof },
        headers: {
          Authorization: `OAuth ${accessToken}`,
          file_offset: '0',
          'Content-Type': 'application/octet-stream',
        },
      });
      return uploaded.data.h;
    } catch (error) {
      rethrowMetaGraphError(error, UNREACHABLE_DETAIL);
    }
  }

  // HMAC-SHA256 of the access token keyed with the app secret, which "Require app secret" demands
  private appsecretProof(accessToken: string): string {
    const cached = this.proofCache.get(accessToken);
    if (cached) return cached;

    const proof = createHmac('sha256', this.appSecret).update(accessToken).digest('hex');
    this.proofCache.set(accessToken, proof);
    return proof;
  }
}

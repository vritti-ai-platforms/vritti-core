import { Injectable } from '@nestjs/common';
import axios, { type AxiosInstance } from 'axios';
import { rethrowMetaGraphError } from '../meta-graph-error.util';

const GRAPH_API_VERSION = 'v25.0';
const REQUEST_TIMEOUT_MS = 15000;
const UNREACHABLE_DETAIL = 'Unable to reach WhatsApp. Please try again later.';

// Single HTTP client for the Meta Graph API. Owns transport concerns only: every WABA carries its own
// access token (one row per organization), so the token is passed per call instead of living in an
// interceptor, and every failure funnels through one translation point.
@Injectable()
export class MetaGraphHttpService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${GRAPH_API_VERSION}`,
      timeout: REQUEST_TIMEOUT_MS,
    });
  }

  async get<T>(accessToken: string, path: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.get<T>(path, {
        params,
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
      const session = await this.client.post<{ id: string }>(
        `/app/uploads?file_length=${file.length}&file_type=${encodeURIComponent(mimeType)}`,
        undefined,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      const uploaded = await this.client.post<{ h: string }>(`/${session.data.id}`, file, {
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
}

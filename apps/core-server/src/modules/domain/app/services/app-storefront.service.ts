import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { signWebhookPayload } from '../../app-webhook/webhook-signature';
import { AppDomainRepository } from '../repositories/app.repository';

const PRODUCT_STATUS_PATH = '/api/vap/products/status';
const PRODUCT_CREATE_PATH = '/api/vap/products';

const READ_TIMEOUT_MS = 3_000;
const WRITE_TIMEOUT_MS = 30_000;
const CHUNK_SIZE = 200;

export interface StorefrontProductStatus {
  exists: boolean;
  metadataComplete: boolean;
}

export interface StorefrontProductToCreate {
  code: string;
  name: string;
}

export interface StorefrontCreateResult {
  created: string[];
  skipped: string[];
  failed: Array<{ code: string; error: string }>;
}

@Injectable()
export class AppStorefrontDomainService {
  private readonly logger = new Logger(AppStorefrontDomainService.name);

  constructor(private readonly repository: AppDomainRepository) {}

  // Which of these codes the storefront has a page for. An empty map means it could not be asked —
  // never "nothing is ready", which callers render differently.
  private async productStatuses(
    appId: string,
    organizationId: string,
    codes: string[],
  ): Promise<Record<string, StorefrontProductStatus>> {
    if (codes.length === 0) {
      return {};
    }

    const response = await this.post<{ statuses?: Record<string, StorefrontProductStatus> }>(
      appId,
      organizationId,
      PRODUCT_STATUS_PATH,
      { codes },
      READ_TIMEOUT_MS,
    );
    return response?.statuses ?? {};
  }

  // Asks about any number of codes, a chunk at a time. An unanswered chunk is simply absent from the result.
  async productStatusesInChunks(
    appId: string,
    organizationId: string,
    codes: string[],
  ): Promise<Record<string, StorefrontProductStatus>> {
    const merged: Record<string, StorefrontProductStatus> = {};

    for (let i = 0; i < codes.length; i += CHUNK_SIZE) {
      const chunk = codes.slice(i, i + CHUNK_SIZE);
      Object.assign(merged, await this.productStatuses(appId, organizationId, chunk));
    }

    return merged;
  }

  // Asks the storefront for a page per code it does not have yet
  private async createProducts(
    appId: string,
    organizationId: string,
    products: StorefrontProductToCreate[],
  ): Promise<StorefrontCreateResult> {
    if (products.length === 0) {
      return { created: [], skipped: [], failed: [] };
    }

    const response = await this.post<StorefrontCreateResult>(
      appId,
      organizationId,
      PRODUCT_CREATE_PATH,
      { products },
      WRITE_TIMEOUT_MS,
    );

    if (!response) {
      return {
        created: [],
        skipped: [],
        failed: products.map((product) => ({ code: product.code, error: 'Storefront unreachable' })),
      };
    }
    return response;
  }

  // Creates any number of pages, a chunk at a time, accumulating what each chunk reported
  async createProductsInChunks(
    appId: string,
    organizationId: string,
    products: StorefrontProductToCreate[],
  ): Promise<StorefrontCreateResult> {
    const total: StorefrontCreateResult = { created: [], skipped: [], failed: [] };

    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);
      const result = await this.createProducts(appId, organizationId, chunk);

      total.created.push(...result.created);
      total.skipped.push(...result.skipped);
      total.failed.push(...result.failed);
    }

    return total;
  }

  // One signed POST to a storefront. Null on any failure, so callers can tell an outage from an answer.
  private async post<T>(
    appId: string,
    organizationId: string,
    path: string,
    payload: unknown,
    timeoutMs: number,
  ): Promise<T | null> {
    // Scoped by org as well as id, so an app id arriving from a channel row cannot reach another tenant
    const app = await this.repository.findByIdInOrg(appId, organizationId);
    if (!app?.baseUrl) {
      return null;
    }

    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();

    try {
      const response = await fetch(new URL(path, app.baseUrl).toString(), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-vap-event-id': randomUUID(),
          'x-vap-timestamp': timestamp,
          'x-vap-signature': signWebhookPayload(app.signingKey, timestamp, body),
        },
        body,
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        this.logger.warn(`App ${appId}: ${path} returned HTTP ${response.status}`);
        await response.body?.cancel();
        return null;
      }

      return (await response.json()) as T;
    } catch (error) {
      this.logger.warn(`App ${appId}: ${path} failed — ${(error as Error).message}`);
      return null;
    }
  }
}

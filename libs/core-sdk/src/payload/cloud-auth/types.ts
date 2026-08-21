import type { Field } from 'payload' with { 'resolution-mode': 'import' };
import type { CloudAuthCredentialOptions } from './config';

export interface PayloadInstance {
  secret: string;
  config: { cookiePrefix?: string; serverURL?: string };
  collections: Record<string, { config: CollectionRuntimeConfig }>;
  find(args: {
    collection: string;
    where?: unknown;
    limit?: number;
    depth?: number;
    pagination?: boolean;
  }): Promise<{ docs: unknown[] }>;
  create(args: { collection: string; data: Record<string, unknown> }): Promise<unknown>;
  update(args: { collection: string; id: string | number; data: Record<string, unknown> }): Promise<unknown>;
  delete(args: { collection: string; id: string | number }): Promise<unknown>;
  logger?: { error: (...args: unknown[]) => void; warn: (...args: unknown[]) => void };
}

export interface CollectionRuntimeConfig {
  slug: string;
  auth: { tokenExpiration: number; useSessions?: boolean };
}

export interface MirroredUser {
  id: string | number;
  email?: string | null;
  cloudUserId?: string | null;
  cloudCheckedAt?: string | null;
  sessions?: { id: string; createdAt: Date | string; expiresAt: Date | string }[];
  [key: string]: unknown;
}

export interface VrittiCloudAuthOptions extends CloudAuthCredentialOptions {
  enabled?: boolean;
  collection?: string;
  allowPasswordLogin?: boolean;
  brandLogo?: boolean;
  revalidateAfterMinutes?: number;
  fields?: Field[];
  adminRoute?: string;
}

import { VapError } from '../core/errors.js';
import type { VapSdk } from '../server/sdk.js';

export interface PayloadLike {
  secret: string;
  find(args: {
    collection: string;
    where?: unknown;
    limit?: number;
    depth?: number;
    overrideAccess?: boolean;
  }): Promise<{ docs: unknown[] }>;
  create(args: { collection: string; data: Record<string, unknown>; overrideAccess?: boolean }): Promise<unknown>;
  update(args: {
    collection: string;
    id: string | number;
    data: Record<string, unknown>;
    overrideAccess?: boolean;
  }): Promise<unknown>;
  delete(args: { collection: string; id?: string | number; where?: unknown }): Promise<unknown>;
  logger?: {
    error: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
  };
  config: { custom?: Record<string, unknown> };
}

export interface PartyLike {
  id: string | number;
  email?: string | null;
  phone?: string | null;
  partyId?: string | null;
}

export interface ConfigLike {
  collections?: unknown[];
  endpoints?: unknown[];
  custom?: Record<string, unknown>;
}

export type CollectionLike = Record<string, unknown>;

export type PayloadPlugin = <T extends ConfigLike>(config: T) => T;

export const SDK_CONFIG_KEY = 'vritti';

// The core client the plugin attached to this Payload instance.
export function getSdk(payload: PayloadLike): VapSdk {
  const factory = payload.config.custom?.[SDK_CONFIG_KEY] as (() => VapSdk) | undefined;
  const sdk = typeof factory === 'function' ? factory() : undefined;
  if (!sdk) {
    throw new VapError(
      'The VAP plugin is not registered — add vap() to your Payload plugins.',
      'Not Configured',
      undefined,
    );
  }
  return sdk;
}

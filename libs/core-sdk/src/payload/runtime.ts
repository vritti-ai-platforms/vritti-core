import type { CoreSdk } from '../sdk';
import { CoreError } from '../types';

/**
 * What these helpers need from a Payload instance.
 *
 * Structural rather than importing `Payload` itself, so the helpers stay usable across Payload minors
 * that reshape those generics — and so a test can pass a plain object instead of booting a CMS.
 */
export interface PayloadLike {
  find(args: { collection: string; where?: unknown; limit?: number; depth?: number }): Promise<{ docs: unknown[] }>;
  create(args: { collection: string; data: Record<string, unknown> }): Promise<unknown>;
  // `id` is a number under the postgres adapter and a string under mongo, so both are accepted rather
  // than forcing every caller to cast whichever one their database gives them.
  update(args: { collection: string; id: string | number; data: Record<string, unknown> }): Promise<unknown>;
  delete(args: { collection: string; id?: string | number; where?: unknown }): Promise<unknown>;
  logger?: {
    error: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
  };
  config: { custom?: Record<string, unknown> };
}

/** The signed-in shopper, as Payload's auth returns them. */
export interface ShopperLike {
  id: string | number;
  email?: string | null;
  phone?: string | null;
  partyId?: string | null;
}

/**
 * The slice of a Payload config this plugin touches.
 *
 * Structural rather than Payload's own `Config`, and that is load-bearing: the package's built types
 * would otherwise name one installed copy of payload, and a consumer resolving a different patch gets
 * `Plugin is not assignable to Plugin` — the same nominal-identity trap two copies of `graphql` cause.
 * Describing only what is read and written keeps the plugin usable across Payload minors.
 */
export interface ConfigLike {
  collections?: unknown[];
  custom?: Record<string, unknown>;
}

/** A collection as this package hands it over — opaque on purpose, for the reason above. */
export type CollectionLike = Record<string, unknown>;

/** Structurally compatible with Payload's own `Plugin`, whichever copy the consumer resolves. */
export type PayloadPlugin = <T extends ConfigLike>(config: T) => T;

/** Where the plugin parks the client on the Payload config. */
export const SDK_CONFIG_KEY = 'vritti';

/**
 * The core client the plugin attached to this Payload instance.
 *
 * Reached through `payload.config.custom` rather than a module singleton so there is exactly one
 * client per Payload instance and no import-order coupling — the plugin put it there while building
 * the config, and every helper and hook finds the same one.
 *
 * Throws rather than returning undefined: reaching here without the plugin registered is a
 * configuration mistake, and a clear message beats `Cannot read properties of undefined`.
 */
export function getSdk(payload: PayloadLike): CoreSdk {
  // A factory, not the client itself — see the note in plugin.ts on why a getter would defeat the
  // deferral it was meant to provide.
  const factory = payload.config.custom?.[SDK_CONFIG_KEY] as (() => CoreSdk) | undefined;
  const sdk = typeof factory === 'function' ? factory() : undefined;
  if (!sdk) {
    throw new CoreError(
      'The Vritti core plugin is not registered — add vrittiCore() to your Payload plugins.',
      'Not Configured',
      undefined,
    );
  }
  return sdk;
}

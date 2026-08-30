// Payload is ESM-only while this package emits CommonJS, so a type-only import needs to be told which
// resolution mode to read its `exports` map under. Safe precisely because it is type-only: nothing here
// imports a runtime value from payload, so there is no CJS/ESM interop at all in the built output.
import type { Field } from 'payload' with { 'resolution-mode': 'import' };
import type { VapSdkOptions } from '../core/config';
import { createPostgresResponseCache } from '../server/cache/postgres';
import { createVapSdk } from '../server/sdk';
import { customersCollection } from './collections/customers';
import { vapCacheCollection } from './collections/vap-cache';
import { type ConfigLike, type PayloadPlugin, SDK_CONFIG_KEY } from './runtime';

export interface VapOptions extends VapSdkOptions {
  /** Mirrors `s3Storage` — off leaves the config untouched, so a branch can disable it without edits. */
  enabled?: boolean;

  /**
   * Where to cache core's responses — the same connection string Payload's adapter is given.
   *
   * Supplying it turns caching on: the plugin builds the store over its own `vap-cache` table, so a
   * storefront gets it by configuring one value instead of writing an adapter. Omit it and the client
   * behaves exactly as it does without a cache, and no pool is ever opened.
   *
   * Caching is still opt-in per operation on top of this — a store only makes it possible.
   */
  databaseUrl?: string;

  /**
   * The schema Payload namespaces its tables under — pass the same value as `postgresAdapter`'s
   * `schemaName`, or the cache addresses a table that is not there.
   */
  databaseSchema?: string;

  /** Extra fields appended to the generated collections, for a storefront's own columns. */
  fields?: {
    customers?: Field[];
    vapCache?: Field[];
  };
}

/**
 * Everything a storefront needs to talk to VAP, as one Payload plugin.
 *
 * ```ts
 * plugins: [
 *   vap({
 *     endpoint: process.env.CORE_GRAPHQL_URL,
 *     clientId: process.env.VRITTI_APP_CLIENT_ID,
 *     clientSecret: process.env.VRITTI_APP_CLIENT_SECRET,
 *   }),
 * ]
 * ```
 *
 * That generates the `customers` collection and attaches the core client.
 * The credentials are read by the host and passed in — the SDK touches no environment variable of
 * its own, for the reasons in `resolveConfig`. Those three names are what cloud seals into a
 * provisioned website's container, so on one of those the block above is the whole configuration.
 *
 * **Why a plugin and not a module the app imports.** Payload's `Plugin` is
 * `(config: Config) => Config`, and contributing collections is only possible from inside that
 * transform. Every storefront otherwise hand-writes the same two collections and they drift — which is
 * exactly what happened before this existed.
 *
 * **The client is built lazily.** A getter rather than a value, so a missing variable fails the first
 * request that needs core instead of the whole CMS at boot: the storefront's pages, its login and its
 * admin panel are all meant to work with core unreachable.
 *
 * **`custom` is server-only.** It is in Payload's `serverOnlyConfigProperties` strip list, so the
 * client — and the signing key it holds — never reaches the browser bundle.
 */
export function vap(options: VapOptions = {}): PayloadPlugin {
  const { enabled = true, fields, databaseUrl, databaseSchema, ...sdkOptions } = options;

  return <T extends ConfigLike>(config: T): T => {
    if (enabled === false) return config;

    let client: ReturnType<typeof createVapSdk> | undefined;

    // Cast because spreading a generic and adding known keys cannot be proven to still be `T`. It is:
    // both keys are declared on ConfigLike, so nothing outside the constraint is being changed.
    return {
      ...config,
      collections: [
        ...(config.collections ?? []),
        customersCollection(fields?.customers),
        vapCacheCollection(fields?.vapCache),
      ],
      custom: {
        ...config.custom,
        // A function rather than a getter, and that matters: spreading an object invokes its getters, so
        // `{ ...config.custom }` anywhere in Payload or in a later plugin would build the client during the
        // config phase — and throw there when a credential is missing, which is exactly what deferring it
        // was meant to avoid. `JSON.stringify` has the same problem. A function reference survives both.
        [SDK_CONFIG_KEY]: () =>
          (client ??= createVapSdk({
            ...sdkOptions,
            // Only when a connection was supplied — otherwise the client has no store and never
            // consults one, which is the same shape it had before caching existed.
            ...(databaseUrl ? { responseCache: createPostgresResponseCache({ databaseUrl, databaseSchema }) } : {}),
          })),
      },
    } as T;
  };
}

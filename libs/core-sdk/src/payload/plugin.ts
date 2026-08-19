// Payload is ESM-only while this package emits CommonJS, so a type-only import needs to be told which
// resolution mode to read its `exports` map under. Safe precisely because it is type-only: nothing here
// imports a runtime value from payload, so there is no CJS/ESM interop at all in the built output.
import type { Field } from 'payload' with { 'resolution-mode': 'import' };
import type { CoreSdkOptions } from '../config';
import { createCoreSdk } from '../sdk';
import { coreCacheCollection } from './collections/core-cache';
import { customerSessionsCollection } from './collections/customer-sessions';
import { customersCollection } from './collections/customers';
import { createPostgresResponseCache } from './response-cache-postgres';
import { type ConfigLike, type PayloadPlugin, SDK_CONFIG_KEY } from './runtime';

export interface VrittiCoreOptions extends CoreSdkOptions {
  /** Mirrors `s3Storage` — off leaves the config untouched, so a branch can disable it without edits. */
  enabled?: boolean;

  /**
   * Where to cache core's responses — the same connection string Payload's adapter is given.
   *
   * Supplying it turns caching on: the plugin builds the store over its own `core-cache` table, so a
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
    customerSessions?: Field[];
    coreCache?: Field[];
  };
}

/**
 * Everything a storefront needs to talk to Vritti core, as one Payload plugin.
 *
 * ```ts
 * plugins: [ vrittiCore() ]
 * ```
 *
 * That one line generates the `customers` and `customer-sessions` collections and attaches the core
 * client. No credentials to pass: the SDK reads `CORE_GRAPHQL_URL`, `APP_CLIENT_ID` and
 * `APP_PRIVATE_KEY` itself, and anything passed here wins over the environment.
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
export function vrittiCore(options: VrittiCoreOptions = {}): PayloadPlugin {
  const { enabled = true, fields, databaseUrl, databaseSchema, ...sdkOptions } = options;

  return <T extends ConfigLike>(config: T): T => {
    if (enabled === false) return config;

    let client: ReturnType<typeof createCoreSdk> | undefined;

    // Cast because spreading a generic and adding known keys cannot be proven to still be `T`. It is:
    // both keys are declared on ConfigLike, so nothing outside the constraint is being changed.
    return {
      ...config,
      collections: [
        ...(config.collections ?? []),
        customersCollection(fields?.customers),
        customerSessionsCollection(fields?.customerSessions),
        coreCacheCollection(fields?.coreCache),
      ],
      custom: {
        ...config.custom,
        // A function rather than a getter, and that matters: spreading an object invokes its getters, so
        // `{ ...config.custom }` anywhere in Payload or in a later plugin would build the client during the
        // config phase — and throw there when a credential is missing, which is exactly what deferring it
        // was meant to avoid. `JSON.stringify` has the same problem. A function reference survives both.
        [SDK_CONFIG_KEY]: () =>
          (client ??= createCoreSdk({
            ...sdkOptions,
            // Only when a connection was supplied — otherwise the client has no store and never
            // consults one, which is the same shape it had before caching existed.
            ...(databaseUrl ? { responseCache: createPostgresResponseCache({ databaseUrl, databaseSchema }) } : {}),
          })),
      },
    } as T;
  };
}

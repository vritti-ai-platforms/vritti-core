// Payload is ESM-only while this package emits CommonJS, so a type-only import needs to be told which resolution mode
// to read its `exports` map under.
import type { Field } from 'payload' with { 'resolution-mode': 'import' };
import type { VapSdkOptions } from '../core/config.js';
import { createPostgresResponseCache } from '../server/cache/postgres.js';
import { createVapSdk } from '../server/sdk.js';
import { cacheClearEndpoint } from './cache.js';
import { partyCollection } from './collections/parties.js';
import { vapCacheCollection, vapCacheResponsesCollection } from './collections/vap-cache.js';
import { visitorSessionCollection } from './collections/visitor-sessions.js';
import { VAP_NEXT_KEY, VapNextConfig } from './next-config.js';
import { productCreateEndpoint, productStatusEndpoint } from './products.js';
import { type ConfigLike, type PayloadPlugin, SDK_CONFIG_KEY } from './runtime.js';
import { type PaymentEventHandler, paymentWebhookEndpoint } from './webhooks.js';

export interface VapOptions extends VapSdkOptions {
  enabled?: boolean;

  databaseUrl?: string;

  databaseSchema?: string;

  // The response cache. Both default when absent: a 60s TTL and a week of fallback.
  cache?: {
    // How long a cached answer is served without asking core. `0` turns the cache off.
    ttlSeconds?: number;
    // How long a key nobody has requested is kept to fall back on while core is down.
    retentionSeconds?: number;
  };

  fields?: {
    parties?: Field[];
    vapCache?: Field[];
    visitorSessions?: Field[];
  };

  auth?: VapNextConfig;

  onPaymentEvent?: PaymentEventHandler;
}

// Everything a storefront needs to talk to VAP, as one Payload plugin.
export function vap(options: VapOptions = {}): PayloadPlugin {
  const { enabled = true, fields, databaseUrl, databaseSchema, cache, auth, onPaymentEvent, ...sdkOptions } = options;

  // One store for the client and the clear endpoint. It opens its pool on first use, so building it here costs nothing.
  const responseCache = databaseUrl
    ? createPostgresResponseCache({ databaseUrl, databaseSchema, retentionSeconds: cache?.retentionSeconds })
    : undefined;

  return <T extends ConfigLike>(config: T): T => {
    if (enabled === false) return config;

    let client: ReturnType<typeof createVapSdk> | undefined;

    // Cast because spreading a generic and adding known keys cannot be proven to still be `T`.
    return {
      ...config,
      collections: [
        ...(config.collections ?? []),
        partyCollection(fields?.parties),
        vapCacheCollection(fields?.vapCache),
        vapCacheResponsesCollection(),
        visitorSessionCollection(fields?.visitorSessions),
      ],
      endpoints: [
        ...(config.endpoints ?? []),
        // Core pulls this to show, per listing, whether the storefront has a page for it and whether an
        // editor has called it finished. Only with a credential to verify against: without one every
        // request would be refused anyway, and a route that always 401s is worse than no route.
        ...(sdkOptions.clientSecret
          ? [
              productStatusEndpoint({ clientSecret: sdkOptions.clientSecret }),
              productCreateEndpoint({ clientSecret: sdkOptions.clientSecret }),
            ]
          : []),
        ...(onPaymentEvent ? [paymentWebhookEndpoint({ clientSecret: sdkOptions.clientSecret, onPaymentEvent })] : []),
        // Core clears the cache when the catalogue changes. Needs both a store and a credential to verify core with.
        ...(responseCache && sdkOptions.clientSecret
          ? [cacheClearEndpoint({ clientSecret: sdkOptions.clientSecret, store: responseCache })]
          : []),
      ],
      custom: {
        ...config.custom,
        // A function rather than a getter, and that matters: spreading an object invokes its getters, so `{
        // ...config.custom }` anywhere in Payload or in a later plugin would build the client during the config phase —
        // and throw there when a credential is missing, which is exactly what deferring it was meant to avoid.
        ...(auth ? { [VAP_NEXT_KEY]: auth } : {}),
        [SDK_CONFIG_KEY]: () =>
          (client ??= createVapSdk({
            ...sdkOptions,
            // Only when a connection was supplied — otherwise the client has no store and never consults one, which is
            // the same shape it had before caching existed.
            ...(responseCache ? { responseCache, responseCacheTtlSeconds: cache?.ttlSeconds } : {}),
          })),
      },
    } as T;
  };
}

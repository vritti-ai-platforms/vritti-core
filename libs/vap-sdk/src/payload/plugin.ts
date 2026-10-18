// Payload is ESM-only while this package emits CommonJS, so a type-only import needs to be told which resolution mode
// to read its `exports` map under.
import type { Field } from 'payload' with { 'resolution-mode': 'import' };
import type { VapSdkOptions } from '../core/config.js';
import { createPostgresResponseCache } from '../server/cache/postgres.js';
import { createVapSdk } from '../server/sdk.js';
import { partyCollection } from './collections/parties.js';
import { vapCacheCollection } from './collections/vap-cache.js';
import { visitorSessionCollection } from './collections/visitor-sessions.js';
import { VAP_NEXT_KEY, VapNextConfig } from './next-config.js';
import { type ConfigLike, type PayloadPlugin, SDK_CONFIG_KEY } from './runtime.js';
import { type PaymentEventHandler, paymentWebhookEndpoint } from './webhooks.js';

export interface VapOptions extends VapSdkOptions {
  enabled?: boolean;

  databaseUrl?: string;

  databaseSchema?: string;

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
  const { enabled = true, fields, databaseUrl, databaseSchema, auth, onPaymentEvent, ...sdkOptions } = options;

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
        visitorSessionCollection(fields?.visitorSessions),
      ],
      ...(onPaymentEvent
        ? {
            endpoints: [
              ...(config.endpoints ?? []),
              paymentWebhookEndpoint({ clientSecret: sdkOptions.clientSecret, onPaymentEvent }),
            ],
          }
        : {}),
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
            ...(databaseUrl ? { responseCache: createPostgresResponseCache({ databaseUrl, databaseSchema }) } : {}),
          })),
      },
    } as T;
  };
}

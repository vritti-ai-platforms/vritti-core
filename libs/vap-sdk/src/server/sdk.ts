import { resolveConfig, type VapSdkOptions } from '../core/config.js';
import { createCartOperations } from '../core/domains/cart.js';
import { createCatalogChannelsOperations } from '../core/domains/catalog-channels.js';
import { createCheckoutOperations } from '../core/domains/checkout.js';
import { createOfferingsOperations } from '../core/domains/offerings.js';
import { createPaymentsOperations } from '../core/domains/payments.js';
import { createPeopleOperations } from '../core/domains/people.js';
import { createSmsOtpOperations } from '../core/domains/sms-otp.js';
import { createStructureOperations } from '../core/domains/structure.js';
import { createWhatsappOtpOperations } from '../core/domains/whatsapp-otp.js';
import { createAuthFlows } from '../core/flows/auth.js';
import { createVapClient } from '../core/transport/client.js';
import { type SdkContext, withoutWorkspace } from '../core/types.js';
import { createResponseCacheLink } from './cache/response-cache.js';
import { createSignedFetch } from './signed-fetch.js';

// A client for the VAP API, authenticated with an app credential.
export function createVapSdk(options: VapSdkOptions = {}) {
  const config = resolveConfig(options);

  const client = createVapClient({
    endpoint: config.endpoint,
    fetch: createSignedFetch(config),
    links: config.responseCache
      ? [
          createResponseCacheLink(config.responseCache, config.clientId, {
            defaultTtlSeconds: config.responseCacheTtlSeconds,
          }),
        ]
      : [],
  });

  const coreOrigin = originOf(config.endpoint);

  // Configuration seeds the scope; the caller's own context wins.
  const scoped = (context: SdkContext): SdkContext => ({
    siteId: config.siteId,
    legalEntityId: config.legalEntityId,
    ...context,
  });

  const build = (rawContext: SdkContext = {}) => {
    const { currencyCode, ...context } = scoped(rawContext);
    const people = createPeopleOperations(client, withoutWorkspace(context), currencyCode);
    const whatsappOtp = createWhatsappOtpOperations(client, withoutWorkspace(context));
    const smsOtp = createSmsOtpOperations(client, withoutWorkspace(context));
    return {
      // The two OTP domains, one per core domain.
      whatsappOtp,
      smsOtp,
      people,
      cart: createCartOperations(client, context, currencyCode),
      catalogChannels: createCatalogChannelsOperations(client, context, currencyCode),
      structure: createStructureOperations(client, context, config.siteTypes),
      offerings: createOfferingsOperations(client, context),
      payments: createPaymentsOperations(client, context, coreOrigin),
      checkout: createCheckoutOperations(client, context, currencyCode, coreOrigin),
      auth: createAuthFlows(people, whatsappOtp, smsOtp),
    };
  };

  return {
    ...build(),

    // The Apollo client itself, for an operation no domain covers yet.
    client,

    defaults: {
      siteId: config.siteId ?? null,
      legalEntityId: config.legalEntityId ?? null,
      siteTypes: config.siteTypes ?? [],
    },

    forContext: (context: SdkContext) => build(context),
  };
}

export type VapSdk = ReturnType<typeof createVapSdk>;

function originOf(endpoint: string): string | undefined {
  try {
    return new URL(endpoint).origin;
  } catch {
    return undefined;
  }
}

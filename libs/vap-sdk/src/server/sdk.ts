import { resolveConfig, type VapSdkOptions } from '../core/config';
import { createCatalogOperations } from '../core/domains/catalog';
import { createOtpOperations } from '../core/domains/otp';
import { createPeopleOperations } from '../core/domains/people';
import { createShopperOperations } from '../core/domains/shopper';
import { createAuthFlows } from '../core/flows/auth';
import { createVapClient } from '../core/transport/client';
import type { RequestContext } from '../core/types';
import { createResponseCacheLink } from './cache/response-cache';
import { createSignedFetch } from './signed-fetch';

/**
 * A client for the VAP API, authenticated with an app credential.
 *
 * **Server-side only.** The credential signs every request, so a bundle that could read it could act
 * as this client against its whole organization. React Native gets its own tier, carrying a shopper
 * session rather than the app's key.
 *
 * Not storefront-specific: a shop, an appointment booking site and a partner integration all speak to
 * core the same way, so domains are named for what they do rather than for who is calling.
 *
 * Distinct from `@vritti/api-sdk`, which is the *server* SDK for building Vritti services. This one
 * is what calls them.
 *
 * ```ts
 * const sdk = createVapSdk({ endpoint, clientId, clientSecret });
 * const { partyId } = await sdk.auth.register(input, hooks);
 *
 * // Everything a signed-in shopper does, acting for them:
 * const scoped = sdk.forContext({ partyId });
 * ```
 */
export function createVapSdk(options: VapSdkOptions = {}) {
  const config = resolveConfig(options);

  // One client for the life of the SDK. It caches nothing in memory — see `createVapClient` — so
  // sharing it across requests and organizations is safe, and per-request identity travels as Apollo
  // context instead.
  const client = createVapClient({
    endpoint: config.endpoint,
    fetch: createSignedFetch(config),
    links: config.responseCache ? [createResponseCacheLink(config.responseCache, config.clientId)] : [],
  });

  /**
   * Configuration supplies the scope a storefront always sells in; a caller overrides it.
   *
   * A single-outlet shop sets `siteId` once and never thinks about it again. A shop with a store
   * selector passes the chosen one to `forContext`, and it wins.
   */
  const scoped = (context: RequestContext): RequestContext => ({
    siteId: config.siteId,
    legalEntityId: config.legalEntityId,
    ...context,
  });

  const build = (rawContext: RequestContext = {}) => {
    const context = scoped(rawContext);
    const people = createPeopleOperations(client, context);
    const otp = createOtpOperations(client, context);
    return {
      otp,
      people,
      /**
       * The signed-in shopper's basket and wishlist.
       *
       * Present on the unbound SDK only so the shape is uniform; every call refuses without a
       * party, because core reads the shopper from the signature. Reach it through
       * `sdk.forContext({ partyId })`.
       */
      shopper: createShopperOperations(client, context, config.currency),
      /** The range this storefront sells. Needs no party — it is the shop's catalogue, not a person's. */
      catalog: createCatalogOperations(client, context),
      /** The shared identity sequences — registration, party repair. Composed over the domains above. */
      auth: createAuthFlows(people, otp),
    };
  };

  return {
    ...build(),

    /** The Apollo client itself, for an operation no domain covers yet. */
    client,

    /**
     * The same operations, bound to a party.
     *
     * The party travels as a header **and** inside the signature, so it cannot be stripped or
     * re-pointed in transit. Registration deliberately uses the unbound client: it runs before a
     * party exists.
     */
    forContext: (context: RequestContext) => build(context),
  };
}

export type VapSdk = ReturnType<typeof createVapSdk>;

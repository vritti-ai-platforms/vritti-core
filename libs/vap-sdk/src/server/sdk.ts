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

/**
 * A client for the VAP API, authenticated with an app credential.
 *
 * **Server-side only.** The credential signs every request, so a bundle that could read it could act
 * as this client against its whole organization. React Native gets its own tier, carrying a party
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
 * // Everything a signed-in party does, acting for them:
 * const scoped = sdk.forContext({ partyId });
 *
 * // Payments (site-scoped). Checkout a basket, or take a payment for anything else:
 * const { order, paymentIntent } = await scoped.checkout.startFromCart({ idempotencyKey });
 * const intent = await sdk.payments.createPaymentIntent({
 *   amount: { currency: 'INR', value: '499.00' },
 *   reference: { type: 'booking', id: bookingId },
 *   idempotencyKey: `booking-${bookingId}`,
 * });
 * // Browser: openCheckout(intent.checkout) from '@vritti/vap-sdk/next/checkout', then
 * // sdk.payments.confirmPayment(...). Outcomes arrive as webhooks — see `verifyVapWebhook`.
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

  // Where the world reaches core — the endpoint's origin. Core answers its checkout callback as a path,
  // since it cannot know its own public address; the SDK makes it absolute against this
  const coreOrigin = originOf(config.endpoint);

  /**
   * Configuration seeds the scope; the caller's own context wins.
   *
   * A visitor's selling context lives on their session — `forContext(await resolveWorkspace())` is
   * what a storefront passes, and a store switcher is what changes it. The configured ids are the
   * fallback for a visitor who has not chosen yet.
   */
  const scoped = (context: SdkContext): SdkContext => ({
    siteId: config.siteId,
    legalEntityId: config.legalEntityId,
    ...context,
  });

  const build = (rawContext: SdkContext = {}) => {
    const { currencyCode, ...context } = scoped(rawContext);
    // Currency goes in for the same reason the basket gets it: the wishlist prices its rows, so
    // `savedVariantIds`, `addToWishlist` and `removeFromWishlist` all send a currency code to core.
    // It comes from the context rather than from configuration, so a visitor who switched to a store
    // in another legal entity is priced in that entity's currency rather than the deployment's.
    const people = createPeopleOperations(client, withoutWorkspace(context), currencyCode);
    const whatsappOtp = createWhatsappOtpOperations(client, withoutWorkspace(context));
    const smsOtp = createSmsOtpOperations(client, withoutWorkspace(context));
    return {
      /**
       * The two OTP domains, one per core domain. Primitive on purpose — they send a code and say
       * whether one holds. To sign somebody in, use `auth.sendOtp` / `auth.verifyOtp`, which pick
       * the channel and resolve the party.
       */
      whatsappOtp,
      smsOtp,
      people,
      /**
       * The signed-in party's basket and wishlist.
       *
       * Present on the unbound SDK only so the shape is uniform; every call refuses without a
       * party, because core reads the party from the signature. Reach it through
       * `sdk.forContext({ partyId })`.
       */
      cart: createCartOperations(client, context, currencyCode),
      /** The range this storefront sells. Needs no party — it is the shop's catalogue, not a person's. */
      catalogChannels: createCatalogChannelsOperations(client, context, currencyCode),
      /**
       * The organization's own shape: its stores and legal entities.
       *
       * Named for what it reads rather than for what one use of it is called — core's `structure`
       * module owns these same rows. It is the options source behind a store switcher and the
       * authority a switch is checked against, but it is also just "where may this app sell".
       *
       * Distinct from the *workspace*, which is the one of these a given request acts in. This answers
       * what exists; `resolveWorkspace()` in the Next tier answers where the visitor is.
       */
      structure: createStructureOperations(client, context, config.siteTypes),
      offerings: createOfferingsOperations(client, context),
      /**
       * Taking a payment for anything — intents, confirmation, one status read. Site-scoped; party
       * optional, so a guest can pay. Never cached.
       */
      payments: createPaymentsOperations(client, context, coreOrigin),
      /**
       * The basket, checked out: order and payment intent in one call. Needs a party, like the basket,
       * and the currency it is priced in — which comes from the session's workspace rather than from
       * configuration, so a party who switched site checks out in that site's legal entity's currency.
       */
      checkout: createCheckoutOperations(client, context, currencyCode, coreOrigin),
      /** The shared identity sequences — OTP sign-in, registration, party repair. Composed over the domains above. */
      auth: createAuthFlows(people, whatsappOtp, smsOtp),
    };
  };

  return {
    ...build(),

    /** The Apollo client itself, for an operation no domain covers yet. */
    client,

    /**
     * Where a visitor with no session of their own starts, as configured.
     *
     * Only the seed — never the credential. A caller resolving a default workspace needs these two
     * ids and has no business reaching into the client for anything else.
     */
    defaults: {
      siteId: config.siteId ?? null,
      legalEntityId: config.legalEntityId ?? null,
      siteTypes: config.siteTypes ?? [],
    },

    /**
     * The same operations, bound to a party.
     *
     * The party travels as a header **and** inside the signature, so it cannot be stripped or
     * re-pointed in transit. Registration deliberately uses the unbound client: it runs before a
     * party exists.
     */
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

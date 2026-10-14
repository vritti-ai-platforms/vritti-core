import { VapError } from './errors';
import type { ResponseCacheStore } from './transport/response-cache-store';

export type VapSdkConfig = {
  /** Where core's GraphQL lives. Absolute — these calls are made server-side. */
  endpoint: string;

  /**
   * The app credential identifying this client to core.
   *
   * Server-side only. The secret is an Ed25519 private key that signs every request, so a browser
   * that could read it could act as this client against its whole organization.
   */
  clientId: string;
  clientSecret: string;

  /**
   * Where a visitor with no session of their own starts.
   *
   * **A seed, not a setting.** A storefront's selling context belongs to the visitor: it lives on
   * their session and their store switcher changes it. These two say what a *new* session is given,
   * which is why a provisioned site has them injected by cloud rather than written here by hand.
   *
   * There is deliberately no `currency`. It belongs to the legal entity, so it is resolved from core
   * (`structure.sites()`) when a session is seeded and recorded there — a second place to state it
   * could only disagree with the entity it claims to describe.
   */
  siteId?: string;
  legalEntityId?: string;

  /**
   * Which site types this app may act at — `structure.sites()` asks for these unless a caller says
   * otherwise.
   *
   * **Empty or absent means every type**, which is one instruction with one representation. Injected,
   * like the two ids above: whether a shop should offer warehouses is a deployment's decision, not a
   * constant for a component to carry.
   */
  siteTypes?: string[];

  /** Overridable for tests. Defaults to the global `fetch`. */
  fetch?: typeof fetch;

  /**
   * Where to cache operation results, when you want them cached.
   *
   * Supplied by the caller so this package owns no database driver, no connection pool and no
   * migration — a Postgres-backed implementation lives in the app that already has a pool. Omit it and
   * nothing is cached, which is what a browser-side caller would do.
   *
   * Caching is still opt-in per operation on top of this; providing a store only makes it possible.
   */
  responseCache?: ResponseCacheStore;
};

/**
 * What a request acts as.
 *
 * Just the party today. It stays a named type rather than a bare `partyId` argument because it is
 * covered by the request signature, so anything added here changes the canonical and has to change
 * in core's verifier at the same time.
 */
export type RequestContext = {
  /** The party the app is acting for — a signed-in party, typically. */
  partyId?: string;

  /**
   * The site the request acts at — which store's prices and stock answer it.
   *
   * Price is per listing × site × currency, so a storefront asking "what does this cost" is always
   * asking it of somewhere. A shop with one outlet sets it once from configuration; one with a
   * store selector sets it per request from what the party chose.
   *
   * Covered by the request signature, and the header **name** is signed too — so a request cannot
   * be re-pointed from one site to another, or from a site to a legal entity, in transit.
   *
   * `null` as well as absent, because a resolved workspace says so explicitly: a session acting at its
   * legal entity's level *has* no site, which is a different statement from not having been asked.
   * Both read as "send no site header".
   */
  siteId?: string | null;

  /** The legal entity, for a storefront that sells at LE rather than site level. */
  legalEntityId?: string | null;
};

/**
 * What a caller hands `forContext` — the request context, plus the currency to price in.
 *
 * `currencyCode` sits outside `RequestContext` on purpose. Everything in that type is covered by the
 * request signature; this is not. It rides in the operation body as a variable, which the body hash
 * already covers, so putting it beside the signed fields would misrepresent what protects it.
 *
 * It comes from the visitor's session, which took it from the legal entity that session acts in.
 */
export type SdkContext = RequestContext & {
  currencyCode?: string;
};

/**
 * The context an ORG-level operation sends: who it acts for, and no workspace.
 *
 * A workspace header is not decoration — core checks a request's permissions in the scope it names,
 * and a site header makes every org-level feature (sign-in codes, people, the catalogue, the
 * wishlist) unreachable. So the workspace belongs to the operations that act *in* one, and is
 * stripped from the rest here rather than left for each call to remember.
 */
export function withoutWorkspace({ partyId }: RequestContext): RequestContext {
  return partyId ? { partyId } : {};
}

/** Which workspace a request acts in. `org` carries no workspace header at all. */
export type WorkspaceScope = 'org' | 'le' | 'site';

/**
 * The context for a request made at `scope`: the party, plus only the workspace header that scope
 * names. `org` is `withoutWorkspace` exactly; `le` and `site` add their one id and nothing else, so
 * a site request never also claims a legal entity.
 *
 * Refused when the scope asks for an id the SDK was not configured with — sending no header would
 * silently fall back to org, which is the one thing a caller asking for `site` did not want.
 */
export function contextForScope(context: RequestContext, scope: WorkspaceScope): RequestContext {
  const base = withoutWorkspace(context);
  if (scope === 'org') return base;

  const id = scope === 'site' ? context.siteId : context.legalEntityId;
  if (!id) {
    const setting = scope === 'site' ? 'siteId' : 'legalEntityId';
    throw new VapError(
      `A ${scope}-scoped request needs \`${setting}\` — set it on createVapSdk or pass it to forContext.`,
      'Not Configured',
      undefined,
    );
  }
  return scope === 'site' ? { ...base, siteId: id } : { ...base, legalEntityId: id };
}

/** A currency and a major-unit string, exactly as core sends it. See `MoneyFieldsFragment`. */
export type Money = {
  currency: string;
  /** Major units as a **string** — format it, never `Number` it for arithmetic. */
  value: string;
};

/**
 * How a code reaches someone.
 *
 * Core keeps the two apart — `whatsapp-otps` and `sms-otps` are separate domains with separate
 * permissions — and so does this SDK. This lives here rather than in either domain because it is
 * what a caller passes to `auth.sendOtp` to pick between them: vocabulary shared by both, owned by
 * neither.
 *
 * WhatsApp sends through the credential's `whatsappOtpConfig` (WABA + template), SMS through its
 * `smsOtpConfig` (provider account). A credential may carry either or both — core refuses a channel
 * it has no configuration for.
 */
export const OTP_CHANNELS = { WHATSAPP: 'whatsapp', SMS: 'sms' } as const;

export type OtpChannel = (typeof OTP_CHANNELS)[keyof typeof OTP_CHANNELS];

export type SendOtpResult = {
  sent: boolean;
  /** When the code stops being accepted. */
  expiresAt: string;
  /** The earliest a resend will be allowed. Core enforces it; this is for the countdown. */
  resendAvailableAt: string;
  /**
   * How many digits this credential issues.
   *
   * Per-credential config between 4 and 10, so a form must draw this many boxes rather than assume
   * six. Comes back on the send because that is the first moment a caller could need it.
   */
  codeLength: number;
};

import { VapError } from '@vritti/vap-sdk';
import { getSdk, type PayloadLike } from '@vritti/vap-sdk/payload';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { resolvePayload } from './payload-adapter.js';
import { pointerSid, VISITOR_COOKIE, VISITOR_TTL_SECONDS } from './visitor-pointer.js';

/** Where a visitor is shopping. Every core read that prices anything is made in one of these. */
export type Workspace = {
  /** The store whose prices and stock answer. Null means acting at the legal entity's level. */
  siteId: string | null;
  legalEntityId: string;
  /**
   * What the visitor is quoted in. One of the currencies the resolved catalogue declares — never
   * configured, and no longer taken from the legal entity: an Indian company may price in dollars,
   * and a currency the catalogue has no prices in reads as an empty shop rather than as an error.
   */
  currencyCode: string;
};

/** The scope a workspace reads at: its own store when it has one, otherwise its legal entity. */
export function scopeOf(workspace: Pick<Workspace, 'siteId'>): 'site' | 'le' {
  return workspace.siteId ? 'site' : 'le';
}

/**
 * Reading the visitor's selling context, for a page that renders prices.
 *
 * Deliberately **not** in the `'use server'` module beside it: every export of one of those becomes a
 * callable endpoint, and this is read by server components, which need an ordinary function.
 *
 * Wrapped in React's `cache`, so a render that reads the workspace five times queries once — the same
 * reason `productListing` is cached in a storefront. The cache is per-request, so one visitor's
 * session never answers for another.
 */
export const resolveWorkspace = cache(async (): Promise<Workspace> => {
  const payload = await resolvePayload();
  const sid = await pointerSid((await cookies()).get(VISITOR_COOKIE)?.value, payload.secret);
  if (!sid) return seededWorkspace(payload);

  const { docs } = await payload.find({
    collection: 'visitor-sessions',
    // Expiry in the WHERE rather than left to a sweeper, mirroring `vap-cache`: an expired session is
    // never honoured even if nothing has cleaned it up yet.
    where: { sid: { equals: sid }, expiresAt: { greater_than: new Date().toISOString() } },
    limit: 1,
    overrideAccess: true,
  });

  const session = docs[0] as VisitorSessionRow | undefined;
  if (!session) return seededWorkspace(payload);

  return {
    siteId: session.siteId ?? null,
    legalEntityId: session.legalEntityId,
    currencyCode: session.currencyCode,
  };
});

/**
 * The SDK bound to this request: the visitor's workspace, and a party when there is one.
 *
 * **Use this rather than `getSdk(payload).forContext(...)` by hand.** Every priced read needs the
 * workspace — a basket line, a wishlist row, a listing — and forgetting it does not fail: `scoped()`
 * falls back to the configured default, so a visitor who switched store silently sees the default
 * store's prices. A silent wrong answer is worse than a crash, so there is one way to get a bound SDK
 * and it cannot be half-done.
 *
 * It lives here, in the Next tier, because that is the only tier allowed to read a cookie and the
 * Payload Local API — `createVapSdk` sits in `server/` and cannot reach either, which is why the
 * workspace has to be handed down rather than discovered. `resolveWorkspace` is request-cached, so
 * calling this several times in one request costs one lookup.
 *
 * A caller that must act somewhere a visitor is not — a webhook, a cron, an import — should use
 * `getSdk(payload).forContext({ siteId, legalEntityId, currencyCode })` directly with the workspace it
 * means, because there is no visitor whose session could answer.
 */
export async function vapSdk(payload: PayloadLike, context: { partyId?: string } = {}) {
  return getSdk(payload).forContext({ ...context, ...(await resolveWorkspace()) });
}

/**
 * The context a visitor starts in, from what cloud injected.
 *
 * The currency is the first one the resolved catalogue declares, which is why this costs one cached
 * core read on a cold visit and nothing after. It is deliberately not the legal entity's currency:
 * what a shop can quote is a property of its price list, and seeding from the entity would hand a
 * visitor a currency nothing is priced in — a shop that renders empty with no error to explain it.
 *
 * Throws when no legal entity was injected at all, or when the catalogue declares no currency:
 * both are deploys that cannot price anything, and failing loudly beats pricing everything at zero.
 */
export const seededWorkspace = cache(async (payload: PayloadLike): Promise<Workspace> => {
  const sdk = getSdk(payload);
  const { siteId, legalEntityId } = sdk.defaults;

  if (!legalEntityId) {
    throw new VapError(
      'This storefront has no default legal entity — set a default store or legal entity on the website in Vritti Cloud.',
      'Not Configured',
      undefined,
    );
  }

  const currencyCode = await defaultCurrency(payload, { siteId, legalEntityId });
  return { siteId, legalEntityId, currencyCode };
});

/**
 * The currencies the catalogue resolved for this context declares, in the order it offers them.
 *
 * Asked at the workspace's own scope, so a store reading its outlet's catalogue is offered that
 * catalogue's currencies rather than the company's.
 */
export async function workspaceCurrencies(
  payload: PayloadLike,
  workspace: { siteId: string | null; legalEntityId: string },
): Promise<string[]> {
  const sdk = getSdk(payload).forContext(workspace);
  return sdk.catalogChannels.currencies({ scope: scopeOf(workspace) });
}

/**
 * The currency a context falls back to: `preferred` when the catalogue still declares it, else the
 * first one it does. Used when seeding a session and when a switch of store changes which catalogue
 * answers — keeping a currency the new catalogue cannot price would empty the shop silently.
 */
export async function defaultCurrency(
  payload: PayloadLike,
  workspace: { siteId: string | null; legalEntityId: string },
  preferred?: string,
): Promise<string> {
  const currencies = await workspaceCurrencies(payload, workspace);
  if (preferred && currencies.includes(preferred)) return preferred;

  const [first] = currencies;
  if (!first) {
    throw new VapError(
      'The catalogue this storefront resolves to prices in no currency — add one on its Prices tab in Vritti.',
      'Not Configured',
      undefined,
    );
  }
  return first;
}

/** The row shape, as the Local API hands it back. */
export type VisitorSessionRow = {
  id: string | number;
  sid: string;
  siteId?: string | null;
  legalEntityId: string;
  currencyCode: string;
  partyId?: string | null;
  expiresAt: string;
};

/** `expiresAt` for a session minted now. */
export function visitorSessionExpiry(): string {
  return new Date(Date.now() + VISITOR_TTL_SECONDS * 1000).toISOString();
}

/**
 * Stamps the signed-in party onto the visitor's session, so a store chosen while browsing stays
 * theirs once they have an account.
 *
 * A link, never an authentication — see the collection's note. Nothing reads `partyId` to decide who
 * somebody is; it is there so a sign-in does not lose the choice, and so staff can see which sessions
 * belong to a known party.
 *
 * Idempotent and quiet: no session, no party, or already stamped, and it does nothing. Called after a
 * sign-in rather than on every read, because a write on a cached read would run on pages that only
 * wanted a price.
 */
export async function linkVisitorSession(payload: PayloadLike, partyId: string | null): Promise<void> {
  if (!partyId) return;

  const sid = await pointerSid((await cookies()).get(VISITOR_COOKIE)?.value, payload.secret);
  if (!sid) return;

  const { docs } = await payload.find({
    collection: 'visitor-sessions',
    where: { sid: { equals: sid } },
    limit: 1,
    overrideAccess: true,
  });

  const session = docs[0] as VisitorSessionRow | undefined;
  if (!session || session.partyId === partyId) return;

  await payload.update({
    collection: 'visitor-sessions',
    id: session.id,
    data: { partyId },
    overrideAccess: true,
  });
}

/**
 * Unlinks the party on sign-out, keeping the session and its store.
 *
 * The choice is the browser's, not the account's — the next person at this machine should still land
 * in the same shop. Dropping `partyId` is hygiene: nothing reads it for identity, and a stale link on
 * a shared browser is a claim about somebody who has left.
 */
export async function unlinkVisitorSession(payload: PayloadLike): Promise<void> {
  const sid = await pointerSid((await cookies()).get(VISITOR_COOKIE)?.value, payload.secret);
  if (!sid) return;

  const { docs } = await payload.find({
    collection: 'visitor-sessions',
    where: { sid: { equals: sid } },
    limit: 1,
    overrideAccess: true,
  });

  const session = docs[0] as VisitorSessionRow | undefined;
  if (!session?.partyId) return;

  await payload.update({
    collection: 'visitor-sessions',
    id: session.id,
    data: { partyId: null },
    overrideAccess: true,
  });
}

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
  /** From the legal entity, never configured. */
  currencyCode: string;
};

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
 * The context a visitor starts in, from what cloud injected.
 *
 * The currency is resolved from the legal entity rather than configured, so this costs one cached core
 * read on a cold visit and nothing after. Throws when no legal entity was injected at all: that is a
 * deploy which never chose where it sells, and failing loudly beats pricing everything at nothing.
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

  const entity = await sdk.structure.findLegalEntity(legalEntityId);
  if (!entity) {
    throw new VapError(
      `The configured legal entity ${legalEntityId} is not one this credential may sell as.`,
      'Not Configured',
      undefined,
    );
  }

  return { siteId, legalEntityId, currencyCode: entity.currencyCode };
});

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

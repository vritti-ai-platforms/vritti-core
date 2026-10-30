import { VapError } from '@vritti/vap-sdk';
import { getSdk, type PayloadLike } from '@vritti/vap-sdk/payload';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { resolvePayload } from './payload-adapter.js';
import { pointerSecret, pointerSid, VISITOR_COOKIE, VISITOR_TTL_SECONDS } from './visitor-pointer.js';

export type Workspace = {
  siteId: string | null;
  legalEntityId: string;
  currencyCode: string;
};

// The scope a workspace reads at: its own store when it has one, otherwise its legal entity.
export function scopeOf(workspace: Pick<Workspace, 'siteId'>): 'site' | 'le' {
  return workspace.siteId ? 'site' : 'le';
}

// Reading the visitor's selling context, for a page that renders prices.
export const resolveWorkspace = cache(async (): Promise<Workspace> => {
  const payload = await resolvePayload();
  const sid = await pointerSid((await cookies()).get(VISITOR_COOKIE)?.value, pointerSecret());
  if (!sid) return seededWorkspace(payload);

  const { docs } = await payload.find({
    collection: 'visitor-sessions',
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

// The SDK bound to this request: the visitor's workspace, and a party when there is one.
export async function vapSdk(payload: PayloadLike, context: { partyId?: string } = {}) {
  return getSdk(payload).forContext({ ...context, ...(await resolveWorkspace()) });
}

// The context a visitor starts in: the configured store, else the first store the organization offers, else the
// configured legal entity on its own. The store switcher moves them from there
export const seededWorkspace = cache(async (payload: PayloadLike): Promise<Workspace> => {
  const workspace = await seedScope(getSdk(payload));
  const currencyCode = await defaultCurrency(payload, workspace);
  return { ...workspace, currencyCode };
});

// A configured store names its legal entity itself, so the entity need not be configured beside it
async function seedScope(sdk: ReturnType<typeof getSdk>): Promise<{ siteId: string | null; legalEntityId: string }> {
  const { siteId, legalEntityId } = sdk.defaults;
  if (siteId) {
    const site = await sdk.structure.findSite(siteId);
    if (!site) {
      throw new VapError(
        'This storefront is configured with a store it may not sell from — check the default store on the website in Vritti Cloud.',
        'Not Configured',
        undefined,
      );
    }
    return { siteId: site.id, legalEntityId: site.legalEntityId };
  }
  if (legalEntityId) return { siteId: null, legalEntityId };

  const [first] = await sdk.structure.sites();
  if (!first) {
    throw new VapError(
      'This storefront has no store to sell from — add one in Vritti Cloud, or set a default store or legal entity on the website.',
      'Not Configured',
      undefined,
    );
  }
  return { siteId: first.id, legalEntityId: first.legalEntityId };
}

// The currencies the catalogue resolved for this context declares, in the order it offers them.
export async function workspaceCurrencies(
  payload: PayloadLike,
  workspace: { siteId: string | null; legalEntityId: string },
): Promise<string[]> {
  const sdk = getSdk(payload).forContext(workspace);
  return sdk.catalogChannels.currencies({ scope: scopeOf(workspace) });
}

// The currency a context falls back to: `preferred` when the catalogue still declares it, else the first one it does.
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

export type VisitorSessionRow = {
  id: string | number;
  sid: string;
  siteId?: string | null;
  legalEntityId: string;
  currencyCode: string;
  partyId?: string | null;
  expiresAt: string;
};

// `expiresAt` for a session minted now.
export function visitorSessionExpiry(): string {
  return new Date(Date.now() + VISITOR_TTL_SECONDS * 1000).toISOString();
}

// Stamps the signed-in party onto the visitor's session, so a store chosen while browsing stays theirs once they have
// an account.
export async function linkVisitorSession(payload: PayloadLike, partyId: string | null): Promise<void> {
  if (!partyId) return;

  const sid = await pointerSid((await cookies()).get(VISITOR_COOKIE)?.value, pointerSecret());
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

// Unlinks the party on sign-out, keeping the session and its store.
export async function unlinkVisitorSession(payload: PayloadLike): Promise<void> {
  const sid = await pointerSid((await cookies()).get(VISITOR_COOKIE)?.value, pointerSecret());
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

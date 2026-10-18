'use server';

import { getSdk, type PayloadLike } from '@vritti/vap-sdk/payload';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { resolvePayload } from './payload-adapter.js';
import { formField, type PartyActionState, returnToFrom, withPartyErrors } from './state.js';
import { mintPointer, pointerSecret, pointerSid, VISITOR_COOKIE, VISITOR_TTL_SECONDS } from './visitor-pointer.js';
import {
  defaultCurrency,
  resolveWorkspace,
  type VisitorSessionRow,
  visitorSessionExpiry,
  workspaceCurrencies,
} from './visitor-session.js';

// Changing where a visitor is shopping, as server actions a storefront imports directly.

// Switches to one of the shop's stores.
export async function setWorkspaceAction(_previous: PartyActionState, formData: FormData): Promise<PartyActionState> {
  const returnTo = returnToFrom(formData);
  const payload = await resolvePayload();
  const siteId = formField(formData, 'siteId');
  if (!siteId) return { error: 'No store was chosen.' };

  const result = await withPartyErrors(payload, async () => {
    const site = await getSdk(payload).structure.findSite(siteId);
    if (!site) return { error: 'That store is not available.', field: 'siteId' };

    const current = await resolveWorkspace();
    const workspace = { siteId: site.id, legalEntityId: site.legalEntityId };
    await writeWorkspace(payload, {
      ...workspace,
      currencyCode: await defaultCurrency(payload, workspace, current.currencyCode),
    });
    return { ok: true };
  });

  revalidatePath(returnTo);
  return result;
}

// Switches to selling at a legal entity's level rather than from one store.
export async function setLegalEntityWorkspaceAction(
  _previous: PartyActionState,
  formData: FormData,
): Promise<PartyActionState> {
  const returnTo = returnToFrom(formData);
  const payload = await resolvePayload();
  const legalEntityId = formField(formData, 'legalEntityId');
  if (!legalEntityId) return { error: 'Nothing was chosen.' };

  const result = await withPartyErrors(payload, async () => {
    const entity = await getSdk(payload).structure.findLegalEntity(legalEntityId);
    if (!entity) return { error: 'That is not available.', field: 'legalEntityId' };

    const current = await resolveWorkspace();
    const workspace = { siteId: null, legalEntityId: entity.id };
    await writeWorkspace(payload, {
      ...workspace,
      currencyCode: await defaultCurrency(payload, workspace, current.currencyCode),
    });
    return { ok: true };
  });

  revalidatePath(returnTo);
  return result;
}

// Switches what the visitor is quoted in, leaving the store alone.
export async function setCurrencyAction(_previous: PartyActionState, formData: FormData): Promise<PartyActionState> {
  const returnTo = returnToFrom(formData);
  const payload = await resolvePayload();
  const currencyCode = formField(formData, 'currencyCode');
  if (!currencyCode) return { error: 'No currency was chosen.' };

  const result = await withPartyErrors(payload, async () => {
    const workspace = await resolveWorkspace();
    const offered = await workspaceCurrencies(payload, workspace);
    if (!offered.includes(currencyCode)) {
      return { error: 'This shop does not price in that currency.', field: 'currencyCode' };
    }

    await writeWorkspace(payload, { ...workspace, currencyCode });
    return { ok: true };
  });

  revalidatePath(returnTo);
  return result;
}

// The same two switches in the plain-form shape: `<form action={switchStoreAction}>`.
export async function switchStoreAction(formData: FormData): Promise<void> {
  await setWorkspaceAction({}, formData);
}

// The plain-form shape for the currency switch.
export async function switchCurrencyAction(formData: FormData): Promise<void> {
  await setCurrencyAction({}, formData);
}

// The plain-form shape for selling at a legal entity's level.
export async function switchLegalEntityAction(formData: FormData): Promise<void> {
  await setLegalEntityWorkspaceAction({}, formData);
}

// The sid to write against, minting one when the visitor has none.
async function requirePointerSid(): Promise<string> {
  const secret = pointerSecret();
  const jar = await cookies();
  const existing = await pointerSid(jar.get(VISITOR_COOKIE)?.value, secret);
  if (existing) return existing;

  const pointer = await mintPointer(secret);
  jar.set(VISITOR_COOKIE, pointer, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: VISITOR_TTL_SECONDS,
  });
  // Non-null: it was just minted with this very secret, so it verifies by construction
  return (await pointerSid(pointer, secret)) as string;
}

// Writes the visitor's chosen context onto their session row, creating it on first use.
async function writeWorkspace(
  payload: PayloadLike,
  workspace: { siteId: string | null; legalEntityId: string; currencyCode: string },
): Promise<void> {
  const sid = await requirePointerSid();

  const { docs } = await payload.find({
    collection: 'visitor-sessions',
    where: { sid: { equals: sid } },
    limit: 1,
    overrideAccess: true,
  });

  const existing = docs[0] as VisitorSessionRow | undefined;
  const data = { ...workspace, expiresAt: visitorSessionExpiry() };

  if (existing) {
    await payload.update({ collection: 'visitor-sessions', id: existing.id, data, overrideAccess: true });
    return;
  }

  await payload.create({ collection: 'visitor-sessions', data: { sid, ...data }, overrideAccess: true });
}

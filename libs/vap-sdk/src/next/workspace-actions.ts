'use server';

import { getSdk, type PayloadLike } from '@vritti/vap-sdk/payload';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { resolvePayload } from './payload-adapter.js';
import { formField, type PartyActionState, returnToFrom, withPartyErrors } from './state.js';
import { pointerSid, VISITOR_COOKIE } from './visitor-pointer.js';
import {
  defaultCurrency,
  resolveWorkspace,
  type VisitorSessionRow,
  visitorSessionExpiry,
  workspaceCurrencies,
} from './visitor-session.js';

/**
 * Changing where a visitor is shopping, as server actions a storefront imports directly.
 *
 * Works signed in or not, which is the whole point: a store switcher that only appears after sign-in
 * is one most shoppers never see. The session exists from first contact — middleware mints its
 * pointer — so there is always a row to write.
 *
 * **Nothing here trusts the form.** The target is checked against `structure.sites()`, and the legal
 * entity and currency written are read off *that* answer. A posted `currencyCode` would otherwise let
 * somebody price a basket in a currency the catalogue has no prices in, which reads as an empty shop
 * rather than as an error.
 */

/** Switches to one of the shop's stores. The entity and currency follow from the store. */
export async function setWorkspaceAction(_previous: PartyActionState, formData: FormData): Promise<PartyActionState> {
  const returnTo = returnToFrom(formData);
  const payload = await resolvePayload();
  const siteId = formField(formData, 'siteId');
  if (!siteId) return { error: 'No store was chosen.' };

  const result = await withPartyErrors(payload, async () => {
    const site = await getSdk(payload).structure.findSite(siteId);
    if (!site) return { error: 'That store is not available.', field: 'siteId' };

    // The store decides which catalogue answers, and that catalogue declares its own currencies.
    // Keeping the visitor's choice when the new one still offers it, and falling back to its first
    // otherwise, is what stops a switch of store emptying the shop.
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

/**
 * Switches to selling at a legal entity's level rather than from one store.
 *
 * `siteId` is cleared rather than left behind: a session naming a store in one entity and an entity
 * from another would price against whichever header happened to be sent.
 */
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

/**
 * Switches what the visitor is quoted in, leaving the store alone.
 *
 * Nothing here trusts the form either: the posted code has to be one the resolved catalogue declares.
 * Without that check a visitor could name any currency and get a shop with no prices in it, which
 * renders as "nothing for sale" rather than as the mistake it is.
 */
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

/**
 * The same two switches in the plain-form shape: `<form action={switchStoreAction}>`.
 *
 * `useActionState` gives a form somewhere to show an error, which is why the two above take a previous
 * state — but it needs a client component, and a store switcher is the one control that most wants to
 * work without JavaScript: a shopper on the wrong store sees wrong prices on every page.
 *
 * Returning void loses the error message. That is the trade, and it is the right way round here: a
 * failed switch re-renders on the store the visitor already had, which is visibly nothing happening
 * rather than something wrong. Use the stateful pair where a message matters.
 */
export async function switchStoreAction(formData: FormData): Promise<void> {
  await setWorkspaceAction({}, formData);
}

/** The plain-form shape for the currency switch. See `switchStoreAction`. */
export async function switchCurrencyAction(formData: FormData): Promise<void> {
  await setCurrencyAction({}, formData);
}

/** The plain-form shape for selling at a legal entity's level. See `switchStoreAction`. */
export async function switchLegalEntityAction(formData: FormData): Promise<void> {
  await setLegalEntityWorkspaceAction({}, formData);
}

/**
 * Writes the visitor's chosen context onto their session row, creating it on first use.
 *
 * The pointer is already in a cookie by the time anything calls this — middleware put it there — so
 * there is no cookie to set and none of the "cannot set a cookie while rendering" problem. A pointer
 * that names no row yet simply gets one.
 */
async function writeWorkspace(
  payload: PayloadLike,
  workspace: { siteId: string | null; legalEntityId: string; currencyCode: string },
): Promise<void> {
  const sid = await pointerSid((await cookies()).get(VISITOR_COOKIE)?.value, payload.secret);
  // No pointer means middleware did not run for this route — a matcher that excluded it, or an action
  // posted from somewhere it does not cover. Silently doing nothing would look like a switcher that
  // forgets, so say what is wrong.
  if (!sid) {
    throw new Error('No visitor session cookie — check that vapSessionMiddleware covers this route.');
  }

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

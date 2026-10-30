'use server';

import { VapError } from '@vritti/vap-sdk';
import { getSdk, type PayloadLike } from '@vritti/vap-sdk/payload';
import { revalidatePath } from 'next/cache';
import { requireParty } from './party.js';
import { resolvePayload } from './payload-adapter.js';
import { formField, type PartyActionState, returnToFrom, withPartyErrors } from './state.js';
import { resolveWorkspace, vapSdk } from './visitor-session.js';

// The cart, as server actions a storefront imports directly.

const MAX_QUANTITY = 99;

// The cart a line is edited in: the visitor's store, or the line's own when the form names one. A line belongs to
// the store it was added at, and a cart page lists every store's, so editing one the visitor is not shopping at
// has to carry that store rather than theirs. Core takes the legal entity from the store, so only the store is sent
async function cartFor(payload: PayloadLike, partyId: string, siteId: string) {
  if (!siteId) return (await vapSdk(payload, { partyId })).cart;
  const sdk = getSdk(payload);
  const site = await sdk.structure.findSite(siteId);
  if (!site) throw new VapError('That store is not available.', 'Store Not Available', 404);
  const workspace = await resolveWorkspace();
  return sdk.forContext({ partyId, ...workspace, siteId: site.id, legalEntityId: site.legalEntityId }).cart;
}

export async function addToCartAction(_previous: PartyActionState, formData: FormData): Promise<PartyActionState> {
  const returnTo = returnToFrom(formData);
  const party = await requireParty(returnTo);
  const code = formField(formData, 'code');
  if (!code) return { error: 'Nothing to add.' };

  const quantity = Number(formField(formData, 'quantity') || '1');
  const payload = await resolvePayload();

  const result = await withPartyErrors(payload, async () =>
    (await vapSdk(payload, { partyId: party.partyId })).cart.add(code, quantity).then(() => ({ ok: true })),
  );
  // The header's cart count renders on every page, so the route the party is looking at has to be re-rendered for it
  // to change.
  revalidatePath(returnTo);
  return result;
}

export async function updateCartItemAction(_previous: PartyActionState, formData: FormData): Promise<PartyActionState> {
  const returnTo = returnToFrom(formData);
  const party = await requireParty(returnTo);
  const code = formField(formData, 'code');
  const quantity = Number(formField(formData, 'quantity'));
  if (!code || !Number.isFinite(quantity)) return { error: 'Nothing to change.' };

  const payload = await resolvePayload();
  const result = await withPartyErrors(payload, async () =>
    (await cartFor(payload, party.partyId, formField(formData, 'siteId')))
      .update(code, quantity)
      .then(() => ({ ok: true })),
  );
  revalidatePath(returnTo);
  return result;
}

export async function removeFromCartAction(_previous: PartyActionState, formData: FormData): Promise<PartyActionState> {
  const returnTo = returnToFrom(formData);
  const party = await requireParty(returnTo);
  const code = formField(formData, 'code');
  if (!code) return { error: 'Nothing to remove.' };

  const payload = await resolvePayload();
  const result = await withPartyErrors(payload, async () =>
    (await cartFor(payload, party.partyId, formField(formData, 'siteId'))).remove(code).then(() => ({ ok: true })),
  );
  revalidatePath(returnTo);
  return result;
}

// One step of a product page's quantity stepper.
export async function setCartQuantityAction(
  _previous: PartyActionState,
  formData: FormData,
): Promise<PartyActionState> {
  const returnTo = returnToFrom(formData);
  const party = await requireParty(returnTo);
  const code = formField(formData, 'code');
  const current = Number(formField(formData, 'quantity'));
  const intent = formField(formData, 'intent');
  if (!code || !Number.isInteger(current) || (intent !== 'inc' && intent !== 'dec')) {
    return { error: 'Nothing to change.' };
  }

  const next = intent === 'inc' ? current + 1 : current - 1;
  if (next > MAX_QUANTITY) return { error: `You can add up to ${MAX_QUANTITY} of one item.` };

  const payload = await resolvePayload();
  const result = await withPartyErrors(payload, async () => {
    const cart = await cartFor(payload, party.partyId, formField(formData, 'siteId'));
    return (next < 1 ? cart.remove(code) : cart.update(code, next)).then(() => ({ ok: true }));
  });
  revalidatePath(returnTo);
  return result;
}

'use server';

import { revalidatePath } from 'next/cache';
import { requireParty } from './party.js';
import { resolvePayload } from './payload-adapter.js';
import { formField, type PartyActionState, returnToFrom, withPartyErrors } from './state.js';
import { vapSdk } from './visitor-session.js';

// The basket, as server actions a storefront imports directly.

const MAX_QUANTITY = 99;

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
  // The header's basket count renders on every page, so the route the party is looking at has to be re-rendered for it
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
    (await vapSdk(payload, { partyId: party.partyId })).cart.update(code, quantity).then(() => ({ ok: true })),
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
    (await vapSdk(payload, { partyId: party.partyId })).cart.remove(code).then(() => ({ ok: true })),
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
  const cart = (await vapSdk(payload, { partyId: party.partyId })).cart;
  const result = await withPartyErrors(payload, () =>
    (next < 1 ? cart.remove(code) : cart.update(code, next)).then(() => ({ ok: true })),
  );
  revalidatePath(returnTo);
  return result;
}

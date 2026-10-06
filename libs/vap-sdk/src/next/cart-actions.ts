'use server';

import { getSdk } from '@vritti/vap-sdk/payload';
import { revalidatePath } from 'next/cache';
import { requireParty } from './party.js';
import { resolvePayload } from './payload-adapter.js';
import { formField, returnToFrom, withPartyErrors, type PartyActionState } from './state.js';

/**
 * The basket, as server actions a storefront imports directly.
 *
 * Form posts rather than client fetches, deliberately: a storefront that works with JavaScript off
 * needs them, and a `fetch` cannot follow the `redirect()` a signed-out visitor is answered with.
 *
 * Each one guards first — `requireParty` either hands back a party with a party, or redirects to
 * sign-in carrying where they were, so nothing below deals with a signed-out caller. Nothing passes
 * a party to core: it reads that from the request signature, which is also what proves the basket
 * being changed is theirs.
 */

/** The basket's ceiling per line — the bound core's `ck_cart_items_quantity` CHECK enforces. */
const MAX_QUANTITY = 99;

export async function addToCartAction(
  _previous: PartyActionState,
  formData: FormData,
): Promise<PartyActionState> {
  const returnTo = returnToFrom(formData);
  const party = await requireParty(returnTo);
  const variantId = formField(formData, 'offeringVariantId');
  if (!variantId) return { error: 'Nothing to add.' };

  const quantity = Number(formField(formData, 'quantity') || '1');
  const payload = await resolvePayload();

  const result = await withPartyErrors(payload, () =>
    getSdk(payload)
      .forContext({ partyId: party.partyId })
      .cart.add(variantId, quantity)
      .then(() => ({ ok: true })),
  );
  // The header's basket count renders on every page, so the route the party is looking at has to be
  // re-rendered for it to change.
  revalidatePath(returnTo);
  return result;
}

export async function updateCartItemAction(
  _previous: PartyActionState,
  formData: FormData,
): Promise<PartyActionState> {
  const returnTo = returnToFrom(formData);
  const party = await requireParty(returnTo);
  const variantId = formField(formData, 'offeringVariantId');
  const quantity = Number(formField(formData, 'quantity'));
  if (!variantId || !Number.isFinite(quantity)) return { error: 'Nothing to change.' };

  const payload = await resolvePayload();
  const result = await withPartyErrors(payload, () =>
    getSdk(payload)
      .forContext({ partyId: party.partyId })
      .cart.update(variantId, quantity)
      .then(() => ({ ok: true })),
  );
  revalidatePath(returnTo);
  return result;
}

export async function removeFromCartAction(
  _previous: PartyActionState,
  formData: FormData,
): Promise<PartyActionState> {
  const returnTo = returnToFrom(formData);
  const party = await requireParty(returnTo);
  const variantId = formField(formData, 'offeringVariantId');
  if (!variantId) return { error: 'Nothing to remove.' };

  const payload = await resolvePayload();
  const result = await withPartyErrors(payload, () =>
    getSdk(payload)
      .forContext({ partyId: party.partyId })
      .cart.remove(variantId)
      .then(() => ({ ok: true })),
  );
  revalidatePath(returnTo);
  return result;
}

/**
 * One step of a product page's quantity stepper.
 *
 * The form carries the quantity it was rendered with and `intent` says which way to go. Stepping
 * down from one removes the line rather than asking core for zero, which it refuses — removing is
 * its own operation there.
 */
export async function setCartQuantityAction(
  _previous: PartyActionState,
  formData: FormData,
): Promise<PartyActionState> {
  const returnTo = returnToFrom(formData);
  const party = await requireParty(returnTo);
  const variantId = formField(formData, 'offeringVariantId');
  const current = Number(formField(formData, 'quantity'));
  const intent = formField(formData, 'intent');
  if (!variantId || !Number.isInteger(current) || (intent !== 'inc' && intent !== 'dec')) {
    return { error: 'Nothing to change.' };
  }

  const next = intent === 'inc' ? current + 1 : current - 1;
  if (next > MAX_QUANTITY) return { error: `You can add up to ${MAX_QUANTITY} of one item.` };

  const payload = await resolvePayload();
  const cart = getSdk(payload).forContext({ partyId: party.partyId }).cart;
  const result = await withPartyErrors(payload, () =>
    (next < 1 ? cart.remove(variantId) : cart.update(variantId, next)).then(() => ({ ok: true })),
  );
  revalidatePath(returnTo);
  return result;
}

'use server';

import { getSdk, type PayloadLike } from '@vritti/vap-sdk/payload';
import { revalidatePath } from 'next/cache';
import { requireParty } from './party.js';
import { resolvePayload } from './payload-adapter.js';
import { formField, type PartyActionState, returnToFrom, withPartyErrors } from './state.js';
import { resolveWorkspace } from './visitor-session.js';

/**
 * The saved list, as server actions a storefront imports directly.
 *
 * Same shape and the same reasoning as the basket's — see `cart-actions`.
 */

/**
 * Saves something for later, or takes it back off.
 *
 * The product page knows whether the item is saved — it reads the party's saved ids alongside the
 * basket counts — so the form says which it wants with `intent`. A form posted without one
 * (JavaScript off, a stale page) saves, and "already there" still comes back as an outcome.
 */
/**
 * The SDK bound to this party *and* where they are shopping.
 *
 * Both halves are needed: core reads the party from the signature, and a basket or wishlist line is
 * priced — per listing x site x currency — so a call that names only the party has no currency to
 * price in and is refused. Fetched per action rather than passed in, because `resolveWorkspace` is
 * request-cached and an action is one request.
 */
async function actingFor(payload: PayloadLike, partyId: string) {
  return getSdk(payload).forContext({ partyId, ...(await resolveWorkspace()) });
}

export async function toggleWishlistAction(_previous: PartyActionState, formData: FormData): Promise<PartyActionState> {
  const returnTo = returnToFrom(formData);
  const party = await requireParty(returnTo);
  const variantId = formField(formData, 'offeringVariantId');
  if (!variantId) return { error: 'Nothing to save.' };

  const payload = await resolvePayload();
  const people = (await actingFor(payload, party.partyId)).people;

  if (formField(formData, 'intent') === 'remove') {
    const removed = await withPartyErrors(payload, () =>
      people.removeFromWishlist(variantId).then(() => ({ ok: true })),
    );
    revalidatePath(returnTo);
    return removed;
  }

  const result = await withPartyErrors(payload, async () => {
    const { alreadyExists } = await people.addToWishlist(variantId);
    return alreadyExists
      ? { message: 'This is already in your wishlist.' }
      : { ok: true, message: 'Saved to your wishlist.' };
  });
  revalidatePath(returnTo);
  return result;
}

/** Takes something off the wishlist. Called from the list itself. */
export async function removeFromWishlistAction(
  _previous: PartyActionState,
  formData: FormData,
): Promise<PartyActionState> {
  const returnTo = returnToFrom(formData);
  const party = await requireParty(returnTo);
  const variantId = formField(formData, 'offeringVariantId');
  if (!variantId) return { error: 'Nothing to remove.' };

  const payload = await resolvePayload();
  const result = await withPartyErrors(payload, async () =>
    (await actingFor(payload, party.partyId)).people.removeFromWishlist(variantId).then(() => ({ ok: true })),
  );
  revalidatePath(returnTo);
  return result;
}

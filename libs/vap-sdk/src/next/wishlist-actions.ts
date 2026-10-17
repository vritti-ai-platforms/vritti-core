'use server';

import { revalidatePath } from 'next/cache';
import { requireParty } from './party.js';
import { resolvePayload } from './payload-adapter.js';
import { formField, type PartyActionState, returnToFrom, withPartyErrors } from './state.js';
import { vapSdk } from './visitor-session.js';

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
export async function toggleWishlistAction(_previous: PartyActionState, formData: FormData): Promise<PartyActionState> {
  const returnTo = returnToFrom(formData);
  const party = await requireParty(returnTo);
  const code = formField(formData, 'code');
  if (!code) return { error: 'Nothing to save.' };

  const payload = await resolvePayload();
  const people = (await vapSdk(payload, { partyId: party.partyId })).people;

  if (formField(formData, 'intent') === 'remove') {
    const removed = await withPartyErrors(payload, () => people.removeFromWishlist(code).then(() => ({ ok: true })));
    revalidatePath(returnTo);
    return removed;
  }

  const result = await withPartyErrors(payload, async () => {
    const { alreadyExists } = await people.addToWishlist(code);
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
  const code = formField(formData, 'code');
  if (!code) return { error: 'Nothing to remove.' };

  const payload = await resolvePayload();
  const result = await withPartyErrors(payload, async () =>
    (await vapSdk(payload, { partyId: party.partyId })).people.removeFromWishlist(code).then(() => ({ ok: true })),
  );
  revalidatePath(returnTo);
  return result;
}

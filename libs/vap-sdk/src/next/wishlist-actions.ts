'use server';

import { revalidatePath } from 'next/cache';
import { requireParty } from './party.js';
import { resolvePayload } from './payload-adapter.js';
import { formField, type PartyActionState, returnToFrom, withPartyErrors } from './state.js';
import { vapSdk } from './visitor-session.js';

// The saved list, as server actions a storefront imports directly.

// Saves something for later, or takes it back off.
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

// Takes something off the wishlist.
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

'use server';

import { revalidatePath } from 'next/cache';
import { requireParty } from './party.js';
import { resolvePayload, vapNextConfig } from './payload-adapter.js';
import { formField, type PartyActionState, withPartyErrors } from './state.js';
import { vapSdk } from './visitor-session.js';

// A party's own details and address book, as server actions a storefront imports directly.

const accountRoute = (config: { routes: { account?: string } }) => config.routes.account ?? '/account';
const addressesRoute = (config: { routes: { addresses?: string } }) => config.routes.addresses ?? '/account/addresses';

// The fields, as core takes them.
function readAddress(formData: FormData) {
  return {
    line1: formField(formData, 'line1'),
    line2: formField(formData, 'line2') || null,
    city: formField(formData, 'city') || null,
    region: formField(formData, 'region') || null,
    postalCode: formField(formData, 'postalCode') || null,
    countryCode: formField(formData, 'countryCode') || 'IN',
    isDefault: formData.get('isDefault') === 'on',
  };
}

// Adds one, or edits the one named by `id` — the form carries it when editing.
export async function saveAddressAction(_previous: PartyActionState, formData: FormData): Promise<PartyActionState> {
  const payload = await resolvePayload();
  const route = addressesRoute(vapNextConfig(payload));
  const party = await requireParty(route);

  const address = readAddress(formData);
  if (!address.line1) return { error: 'Please enter the address.', field: 'line1' };

  const people = (await vapSdk(payload, { partyId: party.partyId })).people;
  const id = formField(formData, 'id');

  const result = await withPartyErrors(payload, () =>
    (id ? people.updateAddress(id, address) : people.addAddress(address)).then(() => ({ ok: true })),
  );
  revalidatePath(route);
  return result;
}

export async function removeAddressAction(_previous: PartyActionState, formData: FormData): Promise<PartyActionState> {
  const payload = await resolvePayload();
  const route = addressesRoute(vapNextConfig(payload));
  const party = await requireParty(route);

  const id = formField(formData, 'id');
  if (!id) return { error: 'Nothing to remove.' };

  const result = await withPartyErrors(payload, async () =>
    (await vapSdk(payload, { partyId: party.partyId })).people.removeAddress(id).then(() => ({ ok: true })),
  );
  revalidatePath(route);
  return result;
}

// The party's own name and contact details.
export async function updateProfileAction(_previous: PartyActionState, formData: FormData): Promise<PartyActionState> {
  const payload = await resolvePayload();
  const config = vapNextConfig(payload);
  const route = accountRoute(config);
  const party = await requireParty(route);

  const firstName = formField(formData, 'firstName');
  if (!firstName) return { error: 'Please enter your first name.', field: 'firstName' };

  const lastName = formField(formData, 'lastName');
  const email = formField(formData, 'email');

  const result = await withPartyErrors(payload, async () => {
    const profile = await (await vapSdk(payload, { partyId: party.partyId })).people.updateProfile({
      // Empty means cleared, which is a real choice on an optional field — `null` says that, where `''` would store a
      // blank string that reads as a name of no characters.
      firstName,
      lastName: lastName || null,
      email: email || null,
    });

    // The storefront's own copy of the name, kept in step.
    await payload.update({
      collection: config.collection ?? 'parties',
      id: party.id,
      data: { name: profile.displayName },
    });
    return { ok: true };
  });

  // A header greeting is rendered by the layout on every route, so the whole page is revalidated rather than just this
  // one's data.
  revalidatePath(route);
  return result;
}

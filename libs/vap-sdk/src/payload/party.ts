import { CHANNELS } from '../people/types';
import { getSdk, type PayloadLike, type ShopperLike } from './runtime';

/**
 * Makes sure a shopper has the commerce party behind them that their orders will reference.
 *
 * Signup normally sets this: `people.register` resolves or creates the party and its `linkLocal` hook
 * writes the id onto the customer. But that last step is deliberately non-fatal — a shopper whose
 * party exists while the write back failed is signed up and usable, and `register` only reports it as
 * `linked: false`. Without a repair, that account stays party-less for good.
 *
 * This is the repair, and signing in is the natural moment for it: the shopper is proving they own the
 * email, which is the same thing the lookup matches on.
 *
 * Resolution is email then phone, mirroring `register`, so a repair lands on the same party the
 * original signup would have chosen. Where several people share an address core returns them
 * oldest-first and the first wins — again matching `register`.
 *
 * **Never throws.** Core being unreachable must not stop someone signing in; they simply have no party
 * this session and the next sign-in tries again.
 */
export async function ensurePartyId(args: { payload: PayloadLike; customer: ShopperLike }): Promise<string | null> {
  const { payload, customer } = args;
  if (customer.partyId) return customer.partyId;

  try {
    const { people } = getSdk(payload);
    const email = customer.email?.trim().toLowerCase();

    let matches = email ? await people.findByCommunication(CHANNELS.EMAIL, email) : [];
    if (matches.length === 0 && customer.phone) {
      matches = await people.findByCommunication(CHANNELS.PHONE, customer.phone.trim());
    }

    const partyId = matches[0];
    if (!partyId) {
      // No party on either channel. Not an error: a shopper created in the admin panel, or one whose
      // signup failed before core was reached, legitimately has none yet.
      payload.logger?.warn({ email: customer.email }, 'No commerce party found for customer');
      return null;
    }

    await payload.update({ collection: 'customers', id: customer.id, data: { partyId } });
    payload.logger?.info({ email: customer.email, partyId }, 'Repaired customer → party link');
    return partyId;
  } catch (error) {
    payload.logger?.error({ err: error, email: customer.email }, 'Could not resolve the commerce party');
    return null;
  }
}

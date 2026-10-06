import { getSdk, type PayloadLike } from '@vritti/vap-sdk/payload';
import { headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolvePayload, vapNextConfig } from './payload-adapter.js';

/** A local party row that is signed in **and** linked to its party in core. */
export type PartySession = { id: string | number; phone: string; partyId: string };

/**
 * The signed-in party, or null.
 *
 * Never throws: a database that is down should render the signed-out header, not a 500 on every
 * route. The collection is checked rather than merely "is somebody signed in" — Payload issues one
 * cookie for the whole app, so a staff `users` session must not read as a shopper.
 */
export async function getCurrentParty(): Promise<
  (PartySession & { partyId: string | null }) | null
> {
  try {
    const payload = await resolvePayload();
    const collection = vapNextConfig(payload).collection ?? 'parties';
    const auth = (payload as unknown as {
      auth: (args: { headers: Headers }) => Promise<{ user?: { collection?: string } | null }>;
    }).auth;

    const { user } = await auth.call(payload, { headers: await nextHeaders() });
    if (!user || user.collection !== collection) return null;
    return user as PartySession & { partyId: string | null };
  } catch {
    return null;
  }
}

/**
 * The signed-in party, or a redirect to sign in.
 *
 * Three states, not two, and the third is the one that bites: a row whose `partyId` never got set —
 * made in the admin panel, or whose link failed during signup — is **repaired here** rather than
 * failing later at checkout. The repair goes through `resolveParty`, the same matching the sign-in
 * uses, so it lands on the party a fresh sign-in would have found rather than inventing a second.
 */
export async function requireParty(returnTo: string): Promise<PartySession> {
  const payload = await resolvePayload();
  const config = vapNextConfig(payload);
  const collection = config.collection ?? 'parties';
  const loginWithReturn = `${config.routes.login}?next=${encodeURIComponent(returnTo)}`;

  const local = await getCurrentParty();
  if (!local) redirect(loginWithReturn);
  if (local.partyId) return local as PartySession;

  try {
    // Phone only: the parties collection carries no email — it is credential-free, and the phone is
    // the number they proved they hold, which is what core matched them on in the first place.
    const resolved = await getSdk(payload).auth.resolveParty({ phone: local.phone });
    if (resolved) {
      await (payload as PayloadLike).update({
        collection,
        id: local.id,
        data: { partyId: resolved.id },
      });
      return { ...local, partyId: resolved.id };
    }
  } catch {
    // Core unreachable, or it has never seen this number. Either way a fresh sign-in runs the full
    // flow, which creates the party and links it — so sending them through it is the honest move
    // rather than leaving them pressing a button that silently does nothing.
  }

  redirect(loginWithReturn);
}

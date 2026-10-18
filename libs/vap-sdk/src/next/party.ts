import { getSdk, type PayloadLike } from '@vritti/vap-sdk/payload';
import { headers as nextHeaders } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolvePayload, vapNextConfig } from './payload-adapter.js';

export type PartySession = { id: string | number; phone: string; partyId: string };

// The signed-in party, or null.
export async function getCurrentParty(): Promise<(PartySession & { partyId: string | null }) | null> {
  try {
    const payload = await resolvePayload();
    const collection = vapNextConfig(payload).collection ?? 'parties';
    const auth = (
      payload as unknown as {
        auth: (args: { headers: Headers }) => Promise<{ user?: { collection?: string } | null }>;
      }
    ).auth;

    const { user } = await auth.call(payload, { headers: await nextHeaders() });
    if (!user || user.collection !== collection) return null;
    return user as PartySession & { partyId: string | null };
  } catch {
    return null;
  }
}

// The signed-in party, or a redirect to sign in.
export async function requireParty(returnTo: string): Promise<PartySession> {
  const payload = await resolvePayload();
  const config = vapNextConfig(payload);
  const collection = config.collection ?? 'parties';
  const loginWithReturn = `${config.routes.login}?next=${encodeURIComponent(returnTo)}`;

  const local = await getCurrentParty();
  if (!local) redirect(loginWithReturn);
  if (local.partyId) return local as PartySession;

  try {
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
    // Core unreachable, or it has never seen this number.
  }

  redirect(loginWithReturn);
}

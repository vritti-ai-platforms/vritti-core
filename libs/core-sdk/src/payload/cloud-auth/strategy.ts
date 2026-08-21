import { fetchMemberStatus } from './client';
import { resolveCloudAuthCredentials } from './config';
import type { MirroredUser, PayloadInstance, VrittiCloudAuthOptions } from './types';

/**
 * The strategy that authenticates every admin request — and the point where a revoked membership takes effect.
 *
 * It delegates the cookie work to Payload's own `JWTAuthentication`, then, if this account's last
 * membership check has gone stale, asks cloud whether they are still a member. That placement is
 * deliberate: it is the one code path every authenticated request goes through, so revocation does not
 * have to wait for the person to sign in again.
 *
 * Registering it at all is not optional. Payload enables its built-in `local-jwt` strategy only when some
 * collection still has the local strategy on (`payload/dist/index.js`), so on a site where the admin
 * collection is the only auth collection — and this plugin has just turned its password login off — the
 * cookie we mint would authenticate nobody.
 *
 * **Fails open on a network error, closed on an explicit answer.** Cloud being unreachable must not lock
 * every administrator out of a running site; cloud saying "not a member" must lock exactly one out.
 */
export function buildAuthStrategy(options: VrittiCloudAuthOptions, collection: string) {
  const staleAfterMs = (options.revalidateAfterMinutes ?? 15) * 60 * 1000;

  return {
    name: 'vritti-cloud',
    authenticate: async (args: { headers: Headers; payload: PayloadInstance; [key: string]: unknown }) => {
      const { JWTAuthentication } = await import('payload');
      const result = (await (JWTAuthentication as unknown as (a: unknown) => Promise<{ user?: MirroredUser | null }>)(
        args,
      )) ?? { user: null };

      const user = result.user;
      if (!user?.cloudUserId) return result;
      if (!isStale(user, staleAfterMs)) return result;

      const { payload } = args;
      try {
        const credentials = resolveCloudAuthCredentials(options);
        const [status] = await fetchMemberStatus(credentials, [user.cloudUserId]);
        if (status && !status.active) {
          // Sessions cascade with the row, so this ends every device they are signed in on, not just this one.
          await payload.delete({ collection, id: user.id });
          return { user: null };
        }
        await payload.update({ collection, id: user.id, data: { cloudCheckedAt: new Date().toISOString() } });
      } catch (error) {
        payload.logger?.warn({ err: error }, 'Could not revalidate Vritti Cloud membership — allowing the request');
      }

      return result;
    },
  };
}

function isStale(user: MirroredUser, staleAfterMs: number): boolean {
  if (staleAfterMs === 0) return true;
  if (!user.cloudCheckedAt) return true;
  return Date.now() - new Date(user.cloudCheckedAt).getTime() > staleAfterMs;
}

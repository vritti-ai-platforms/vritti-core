import { randomBytes } from 'node:crypto';
import type { CloudUserInfo } from './client';
import { fetchMemberStatus } from './client';
import type { CloudAuthCredentials } from './config';
import type { MirroredUser, PayloadInstance } from './types';

// Matches the cap the members/status endpoint enforces on its subs array.
const MEMBER_STATUS_BATCH = 500;

/**
 * The local admin record is a **mirror**, never a source of truth.
 *
 * Vritti Cloud decides who may administer the site; this row exists only so Payload has something to
 * hang a session, its preferences and its document locks on. Nothing here creates access — a person who
 * is not a member of the app's organization never reaches this file, because cloud refuses to issue them
 * a code in the first place.
 */
export async function upsertMirroredUser(args: {
  payload: PayloadInstance;
  collection: string;
  info: CloudUserInfo;
}): Promise<MirroredUser> {
  const { payload, collection, info } = args;

  const byCloudId = await findOne(payload, collection, { cloudUserId: { equals: info.sub } });
  if (byCloudId) {
    return (await payload.update({
      collection,
      id: byCloudId.id,
      data: { cloudCheckedAt: new Date().toISOString(), ...profileFields(info) },
    })) as MirroredUser;
  }

  // Adopt an existing account with the same address rather than colliding with it. This is what carries a
  // site's original password-era admins over: the first time they sign in with Vritti, their row is
  // claimed and stamped, keeping their document history and preferences intact.
  if (info.email) {
    const byEmail = await findOne(payload, collection, { email: { equals: info.email } });
    if (byEmail) {
      return (await payload.update({
        collection,
        id: byEmail.id,
        data: { cloudUserId: info.sub, cloudCheckedAt: new Date().toISOString(), ...profileFields(info) },
      })) as MirroredUser;
    }
  }

  // Payload's auth collections require an email, so a claim set without one cannot produce an account.
  // It means the OAuth app was registered without the `email` scope — a configuration mistake, and one
  // worth naming, because the alternative is a validation error from three layers down.
  if (!info.email) {
    throw new Error(
      'Vritti Cloud returned no email address — grant this OAuth app the "email" scope in cloud, under Organization → OAuth Apps.',
    );
  }

  return (await payload.create({
    collection,
    data: {
      email: info.email,
      cloudUserId: info.sub,
      cloudOrgId: info.organization?.id ?? null,
      cloudCheckedAt: new Date().toISOString(),
      ...profileFields(info),
      // Payload keeps the password column when `disableLocalStrategy.enableFields` is set. Nothing can log
      // in with this value — the local strategy is off — but a random one beats leaving a null that a
      // later re-enabling of password login would turn into an empty-password account.
      password: randomBytes(32).toString('base64url'),
    },
  })) as MirroredUser;
}

/**
 * Deletes the mirrored accounts of people who are no longer members.
 *
 * Runs on every sign-in attempt, successful or denied. That timing is deliberate: someone removed from
 * the organization can never complete a sign-in again, so their row would otherwise sit there forever —
 * this is the only moment anything is guaranteed to ask cloud about them.
 *
 * Never throws. Cloud being unreachable must not stop a member signing in.
 */
export async function reconcileMirroredUsers(args: {
  payload: PayloadInstance;
  collection: string;
  credentials: CloudAuthCredentials;
}): Promise<number> {
  const { payload, collection, credentials } = args;

  try {
    const { docs } = await payload.find({
      collection,
      where: { cloudUserId: { exists: true } },
      depth: 0,
      pagination: false,
    });

    const users = docs as MirroredUser[];
    const subs = users.map((user) => user.cloudUserId).filter((sub): sub is string => Boolean(sub));

    // Chunked because the endpoint caps a batch at 500. A site with more admins than that would otherwise
    // have every sweep rejected — and silently, since this never throws.
    const inactive = new Set<string>();
    for (let index = 0; index < subs.length; index += MEMBER_STATUS_BATCH) {
      const statuses = await fetchMemberStatus(credentials, subs.slice(index, index + MEMBER_STATUS_BATCH));
      for (const status of statuses) {
        if (!status.active) inactive.add(status.sub);
      }
    }

    const removals = users.filter((user) => user.cloudUserId && inactive.has(user.cloudUserId));
    for (const user of removals) {
      // Sessions cascade with the row, so this signs them out as well as locking them out.
      await payload.delete({ collection, id: user.id });
    }
    return removals.length;
  } catch (error) {
    payload.logger?.error({ err: error }, 'Could not reconcile Vritti Cloud admin accounts');
    return 0;
  }
}

async function findOne(
  payload: PayloadInstance,
  collection: string,
  where: Record<string, unknown>,
): Promise<MirroredUser | undefined> {
  const { docs } = await payload.find({ collection, where, limit: 1, depth: 0 });
  return docs[0] as MirroredUser | undefined;
}

// Only what cloud is authoritative for. A site's own columns on the collection are never touched.
function profileFields(info: CloudUserInfo): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  if (info.name) fields.name = info.name;
  if (info.organization?.id) fields.cloudOrgId = info.organization.id;
  return fields;
}

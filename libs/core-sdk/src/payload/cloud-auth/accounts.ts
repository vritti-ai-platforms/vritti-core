import { randomBytes } from 'node:crypto';
import type { CloudUserInfo } from './client';
import { fetchMemberStatus } from './client';
import type { CloudAuthCredentials } from './config';
import type { MirroredUser, PayloadInstance } from './types';

const MEMBER_STATUS_BATCH = 500;

// Mirrors a cloud member into the admin collection, adopting an existing row with the same email.
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

  // Adopt an existing account with the same address rather than colliding with it.
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
      password: randomBytes(32).toString('base64url'),
    },
  })) as MirroredUser;
}

// Deletes the mirrored accounts of people who are no longer members.
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

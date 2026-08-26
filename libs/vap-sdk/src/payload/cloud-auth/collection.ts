// Reads payload types under ESM resolution, since this package emits CommonJS.
import type { Field } from 'payload' with { 'resolution-mode': 'import' };
import type { CollectionLike } from '../runtime';
import { buildAuthStrategy } from './strategy';
import type { VrittiCloudAuthOptions } from './types';

// The columns that make the admin collection a mirror of cloud's membership.
export function cloudAuthFields(): Field[] {
  return [
    {
      name: 'cloudUserId',
      type: 'text',
      index: true,
      unique: true,
      admin: {
        readOnly: true,
        description: 'The Vritti Cloud account this admin is. Set on first sign-in and never edited here.',
      },
    },
    {
      name: 'cloudOrgId',
      type: 'text',
      admin: { readOnly: true, description: 'The organization they were a member of at their last sign-in.' },
    },
    {
      name: 'cloudCheckedAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'When their membership was last confirmed with Vritti Cloud.',
        position: 'sidebar',
      },
    },
  ];
}

// Rewrites the admin collection: mirror columns, auth strategy, and the password door.
export function applyCloudAuth(collection: CollectionLike, options: VrittiCloudAuthOptions): CollectionLike {
  const slug = String(collection.slug ?? 'users');
  const auth = typeof collection.auth === 'object' && collection.auth !== null ? collection.auth : {};
  const strategies = Array.isArray((auth as { strategies?: unknown[] }).strategies)
    ? ((auth as { strategies: unknown[] }).strategies ?? [])
    : [];

  return {
    ...collection,
    auth: {
      ...auth,
      ...(options.allowPasswordLogin ? {} : { disableLocalStrategy: { enableFields: true, optionalPassword: true } }),
      strategies: [...strategies, buildAuthStrategy(options, slug)],
    },
    fields: [...((collection.fields as Field[]) ?? []), ...cloudAuthFields(), ...(options.fields ?? [])],
  };
}

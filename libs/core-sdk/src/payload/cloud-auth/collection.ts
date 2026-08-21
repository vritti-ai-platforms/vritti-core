// Payload is ESM-only while this package emits CommonJS, so a type-only import needs to be told which
// resolution mode to read its `exports` map under. Safe precisely because it is type-only.
import type { Field } from 'payload' with { 'resolution-mode': 'import' };
import type { CollectionLike } from '../runtime';
import { buildAuthStrategy } from './strategy';
import type { VrittiCloudAuthOptions } from './types';

/**
 * The columns that make the admin collection a mirror of cloud's membership.
 *
 * All three are read-only in the panel: they are cloud's answers, and an administrator editing them by
 * hand would either lock somebody out or, worse, point an account at a different cloud identity.
 */
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

/**
 * Rewrites the admin collection: adds the mirror columns, registers the strategy, and — by default —
 * closes the password door.
 *
 * `disableLocalStrategy` is set as an OBJECT rather than `true`, which matters three times over:
 * `enableFields` keeps the `email` and `password` columns so `useAsTitle`, email matching and the existing
 * database shape are untouched; `optionalPassword` lets an SSO-created account exist without one; and
 * Payload's own logout and refresh prune session rows only when the value is not literally `true`
 * (`payload/dist/auth/operations/logout.js`).
 */
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

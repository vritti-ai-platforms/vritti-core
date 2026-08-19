// Payload is ESM-only while this package emits CommonJS, so a type-only import needs to be told which
// resolution mode to read its `exports` map under. Safe precisely because it is type-only: nothing here
// imports a runtime value from payload, so there is no CJS/ESM interop at all in the built output.
import type { CollectionConfig, Field } from 'payload' with { 'resolution-mode': 'import' };
import type { CollectionLike } from '../runtime';

/**
 * The store a shopper picked, for one login session.
 *
 * **Why a collection and not a column on `customers`:** the choice belongs to the visit, not the
 * person — the same shopper on a phone and a laptop can be looking at two different stores, and
 * neither should move the other.
 *
 * **Why not Payload's own `customers_sessions`:** that table is generated from a closed type —
 * `UserSession` is `{ id, createdAt, expiresAt }` and Payload writes those rows itself in
 * `addSessionToUser` — so it cannot carry extra columns without patching the package. This is a
 * sibling keyed by the same session id, which `user._sid` exposes (Payload sets it from the JWT in
 * its jwt strategy).
 *
 * Written and read only through the Local API, which is why every access rule below is shut: a
 * shopper must not be able to point their own session at another store by calling the REST API.
 */
export function customerSessionsCollection(extraFields: Field[] = []): CollectionLike {
  // Authored against CollectionConfig for the field-level safety, handed back opaque so the built types
  // never name one installed copy of payload.
  const collection: CollectionConfig = {
    slug: 'customer-sessions',
    labels: { singular: 'Customer Session', plural: 'Customer Sessions' },
    admin: {
      useAsTitle: 'sid',
      defaultColumns: ['sid', 'customer', 'workspaceKind', 'workspaceId', 'expiresAt'],
      group: 'Store',
      description: 'Which store each signed-in shopper is browsing, per session.',
      hidden: ({ user }) => user?.collection !== 'users',
    },
    access: {
      // Staff may look; nobody may write over the API. The Local API bypasses these, which is the
      // only intended path in.
      read: ({ req: { user } }) => user?.collection === 'users',
      create: () => false,
      update: () => false,
      delete: () => false,
    },
    fields: [
      {
        name: 'sid',
        type: 'text',
        required: true,
        unique: true,
        index: true,
        admin: {
          readOnly: true,
          description: 'The Payload session id this choice belongs to (user._sid).',
        },
      },
      {
        name: 'customer',
        type: 'relationship',
        relationTo: 'customers',
        required: true,
        index: true,
        admin: { readOnly: true },
      },
      {
        name: 'workspaceKind',
        type: 'select',
        required: true,
        options: [
          { value: 'site', label: 'Site' },
          { value: 'group', label: 'Site Group' },
          { value: 'le', label: 'Legal Entity' },
          { value: 'org', label: 'Organization' },
        ],
        admin: {
          readOnly: true,
          description:
            'Which scope the id below names. Vritti reads the kind from *which* header is sent, so this is what decides that.',
        },
      },
      {
        name: 'workspaceId',
        type: 'text',
        admin: {
          readOnly: true,
          description: 'Empty for organization scope — that scope is the absence of a narrower one.',
        },
      },
      {
        name: 'expiresAt',
        type: 'date',
        required: true,
        index: true,
        admin: {
          readOnly: true,
          description:
            'Copied from the Payload session. Rows past this are swept on read — nothing else cleans them up, since Payload cannot notify us when a session lapses.',
        },
      },
      ...extraFields,
    ],
    timestamps: true,
  };
  return collection;
}

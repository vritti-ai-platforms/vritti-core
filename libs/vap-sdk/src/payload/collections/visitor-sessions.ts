// Payload is ESM-only while this package emits CommonJS, so a type-only import needs to be told which resolution mode
// to read its `exports` map under.
import type { CollectionConfig, Field } from 'payload' with { 'resolution-mode': 'import' };
import type { CollectionLike } from '../runtime.js';

export const VISITOR_SESSIONS_SLUG = 'visitor-sessions';

// Where a visitor is shopping: the site, the legal entity and the currency their prices come from.
export function visitorSessionCollection(extraFields: Field[] = []): CollectionLike {
  const collection: CollectionConfig = {
    slug: VISITOR_SESSIONS_SLUG,
    labels: { singular: 'Visitor Session', plural: 'Visitor Sessions' },
    admin: {
      useAsTitle: 'sid',
      defaultColumns: ['sid', 'siteId', 'partyId', 'expiresAt'],
      group: 'Store',
      description: 'Where each visitor is shopping. Delete a row to put that visitor back on the default.',
      hidden: ({ user }) => user?.collection !== 'users',
    },
    access: {
      // Staff only, and nothing writes through these rules at all — see the Local API note above.
      read: ({ req: { user } }) => user?.collection === 'users',
      create: () => false,
      update: () => false,
      delete: ({ req: { user } }) => user?.collection === 'users',
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
          description: 'What the signed cookie points at. Opaque and unguessable; it names a row, it proves nothing.',
        },
      },
      {
        name: 'legalEntityId',
        type: 'text',
        required: true,
        admin: {
          readOnly: true,
          description: 'Required: a session that names no legal entity has no currency, so it can price nothing.',
        },
      },
      {
        name: 'siteId',
        type: 'text',
        index: true,
        admin: {
          readOnly: true,
          description: "The store whose prices and stock answer. Null means the session acts at its entity's level.",
        },
      },
      {
        name: 'currencyCode',
        type: 'text',
        required: true,
        admin: {
          readOnly: true,
          description:
            'Resolved from the legal entity when the session was seeded or switched, never configured. Stored so it ' +
            'costs no round trip per request and a switch pins the currency it validated.',
        },
      },
      {
        name: 'partyId',
        type: 'text',
        index: true,
        admin: {
          readOnly: true,
          description:
            'Set when this session signs in, so a store chosen while browsing carries over. A link only — identity ' +
            "comes from Payload's session, never from here.",
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
            'Enforced in the read query rather than by a sweeper, so an expired session is never honoured even if ' +
            'nothing has cleaned it up yet.',
        },
      },
      ...extraFields,
    ],
    timestamps: true,
  };
  return collection;
}

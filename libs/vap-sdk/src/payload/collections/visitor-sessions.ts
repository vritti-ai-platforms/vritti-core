// Payload is ESM-only while this package emits CommonJS, so a type-only import needs to be told which
// resolution mode to read its `exports` map under. Safe precisely because it is type-only: nothing here
// imports a runtime value from payload, so there is no CJS/ESM interop at all in the built output.
import type { CollectionConfig, Field } from 'payload' with { 'resolution-mode': 'import' };
import type { CollectionLike } from '../runtime';

/** The table Payload derives from the slug — hyphens become underscores. */
export const VISITOR_SESSIONS_SLUG = 'visitor-sessions';

/**
 * Where a visitor is shopping: the site, the legal entity and the currency their prices come from.
 *
 * **Not `parties.sessions`.** That array is the *authentication* session — it hangs off an auth
 * document, so it cannot exist before somebody signs in, and anything keyed to it would force a
 * visitor to have an account before choosing a store. This answers a different question with a
 * different lifetime: it outlives a sign-out, and it exists from the first page a visitor opens.
 *
 * **`partyId` is a link, never an authentication.** It is stamped when a session signs in, so a store
 * chosen while browsing is still theirs afterwards. Identity comes only from Payload's own JWT —
 * holding this row's pointer must never make anybody anybody.
 *
 * The cookie carries a signed pointer to `sid` and nothing else, so the values here cannot be edited
 * by whoever holds it, and a session can be reset by deleting its row.
 *
 * Shaped like `vap-cache`: a collection so Payload's migration generator creates the table and it stays
 * inside reviewed migration history, with every access rule shut and reads staff-only. Nothing reaches
 * it through the REST API — the actions in `next/workspace-actions` use the Local API.
 */
export function visitorSessionCollection(extraFields: Field[] = []): CollectionLike {
  // Authored against CollectionConfig for the field-level safety, handed back opaque so the built types
  // never name one installed copy of payload.
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
      // Open to staff alone: deleting a row is how support resets a visitor who is stuck on the
      // wrong store, and it takes effect on that visitor's next request.
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

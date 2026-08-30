// Payload is ESM-only while this package emits CommonJS, so a type-only import needs to be told which
// resolution mode to read its `exports` map under. Safe precisely because it is type-only: nothing here
// imports a runtime value from payload, so there is no CJS/ESM interop at all in the built output.
import type { CollectionConfig, Field } from 'payload' with { 'resolution-mode': 'import' };
import type { CollectionLike } from '../runtime';

/** The table name Payload derives from the slug — hyphens become underscores. */
export { VAP_CACHE_TABLE } from '../../server/cache/postgres';

/**
 * Cached responses from VAP, one row per operation-and-scope.
 *
 * **A collection purely so Payload's migration generator creates the table.** Nothing reads or writes it
 * through the Local API — the store in `response-cache-postgres.ts` uses one indexed query per hit,
 * because this is consulted on every cached request and a document pipeline is the wrong shape for that.
 * Declaring it here is what keeps the table inside the reviewed migration history instead of appearing
 * from a `CREATE TABLE IF NOT EXISTS` the first time something is cached.
 *
 * Every access rule is shut and reads are staff-only: there is nothing here a visitor should reach, and
 * the keys themselves encode which shopper and which store a result belongs to.
 */
export function vapCacheCollection(extraFields: Field[] = []): CollectionLike {
  // Authored against CollectionConfig for the field-level safety, handed back opaque so the built types
  // never name one installed copy of payload.
  const collection: CollectionConfig = {
    slug: 'vap-cache',
    labels: { singular: 'VAP Cache Entry', plural: 'VAP Cache' },
    admin: {
      useAsTitle: 'key',
      defaultColumns: ['key', 'expiresAt', 'updatedAt'],
      group: 'Store',
      description: 'Cached responses from VAP. Machinery — nothing here is edited by hand.',
      hidden: ({ user }) => user?.collection !== 'users',
    },
    access: {
      read: ({ req: { user } }) => user?.collection === 'users',
      create: () => false,
      update: () => false,
      delete: () => false,
    },
    fields: [
      {
        name: 'key',
        type: 'text',
        required: true,
        unique: true,
        index: true,
        admin: {
          readOnly: true,
          description:
            'operation name, then a hash of the credential, party and variables. The operation leads so a whole operation can be invalidated by prefix.',
        },
      },
      {
        name: 'result',
        type: 'json',
        required: true,
        admin: {
          readOnly: true,
          description: 'The whole GraphQL payload as it came back, replayed verbatim on a hit.',
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
            'Enforced in the read query rather than by a sweeper, so an expired row is never served even if nothing has cleaned it up yet.',
        },
      },
      ...extraFields,
    ],
    timestamps: true,
  };
  return collection;
}

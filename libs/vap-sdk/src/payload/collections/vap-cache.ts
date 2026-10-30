// Payload is ESM-only while this package emits CommonJS, so a type-only import needs to be told which resolution mode
// to read its `exports` map under.
import type { CollectionConfig, CollectionSlug, Field } from 'payload' with { 'resolution-mode': 'import' };
import type { CollectionLike } from '../runtime.js';

// The table names Payload derives from the slugs — hyphens become underscores.
export { VAP_CACHE_RESPONSES_TABLE, VAP_CACHE_TABLE } from '../../server/cache/postgres.js';

const VAP_CACHE_RESPONSES_SLUG = 'vap-cache-responses';

// Staff may look; nobody writes through Payload — the response cache owns these rows.
const machineryAccess: CollectionConfig['access'] = {
  read: ({ req: { user } }) => user?.collection === 'users',
  create: () => false,
  update: () => false,
  delete: () => false,
};

// Cached responses from VAP, one row per operation-and-scope, each pointing at the response it last got.
export function vapCacheCollection(extraFields: Field[] = []): CollectionLike {
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
    access: machineryAccess,
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
            'operation name, then a hash of the credential, party and variables. The operation leads so a whole operation can be cleared by prefix.',
        },
      },
      {
        name: 'response',
        type: 'relationship',
        relationTo: VAP_CACHE_RESPONSES_SLUG as CollectionSlug,
        required: true,
        index: true,
        admin: {
          readOnly: true,
          description: 'The response this key last got. Keys that got the same answer share one row.',
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
            'Served without asking core until then. After it, core is asked again — and if core cannot answer, this response is served anyway.',
        },
      },
      ...extraFields,
    ],
    // `updatedAt` is when core last confirmed the response; the retention sweep reads it.
    timestamps: true,
  };
  return collection;
}

// Each distinct response once, addressed by a hash of its content.
export function vapCacheResponsesCollection(): CollectionLike {
  const collection: CollectionConfig = {
    slug: VAP_CACHE_RESPONSES_SLUG,
    labels: { singular: 'VAP Cache Response', plural: 'VAP Cache Responses' },
    admin: {
      useAsTitle: 'hash',
      defaultColumns: ['hash', 'createdAt'],
      group: 'Store',
      description: 'The distinct responses behind the VAP cache. Machinery — nothing here is edited by hand.',
      hidden: ({ user }) => user?.collection !== 'users',
    },
    access: machineryAccess,
    fields: [
      {
        name: 'hash',
        type: 'text',
        required: true,
        unique: true,
        index: true,
        admin: { readOnly: true, description: 'sha256 of the response — the same answer is stored once.' },
      },
      {
        name: 'result',
        type: 'json',
        required: true,
        admin: { readOnly: true, description: 'The whole GraphQL payload as it came back, replayed verbatim.' },
      },
    ],
    timestamps: true,
  };
  return collection;
}

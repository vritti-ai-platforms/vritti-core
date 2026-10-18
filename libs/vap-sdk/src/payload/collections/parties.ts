// Payload is ESM-only while this package emits CommonJS, so a type-only import needs to be told which resolution mode
// to read its `exports` map under.
import type { CollectionConfig, Field } from 'payload' with { 'resolution-mode': 'import' };
import type { CollectionLike } from '../runtime.js';

// True for a staff account, false for a party or an anonymous request.
function isStaff(user: { collection?: string } | null | undefined): boolean {
  return user?.collection === 'users';
}

const sessionsField: Field = {
  name: 'sessions',
  type: 'array',
  access: {
    // A session list is the one thing a party must not read about anyone else, and must never write.
    read: ({ doc, req: { user } }) => user?.id === doc?.id,
    update: () => false,
  },
  admin: { disabled: true },
  fields: [
    { name: 'id', type: 'text', required: true },
    { name: 'createdAt', type: 'date', defaultValue: () => new Date() },
    { name: 'expiresAt', type: 'date', required: true },
  ],
};

// Storefront accounts — the people who sign in on the site itself.
export function partyCollection(extraFields: Field[] = []): CollectionLike {
  const collection: CollectionConfig = {
    slug: 'parties',
    labels: { singular: 'Party', plural: 'Parties' },
    auth: {
      tokenExpiration: 60 * 60 * 24 * 7,
      disableLocalStrategy: true,
    },
    admin: {
      useAsTitle: 'phone',
      defaultColumns: ['name', 'phone', 'partyId', 'createdAt'],
      group: 'Store',
      description: 'People who signed in on the storefront. Their identity lives in Vritti.',
    },
    access: {
      admin: () => false,
      read: ({ req: { user } }) => {
        if (!user) return false;
        if (isStaff(user)) return true;
        return { id: { equals: user.id } };
      },
      update: ({ req: { user } }) => {
        if (!user) return false;
        if (isStaff(user)) return true;
        return { id: { equals: user.id } };
      },
      delete: ({ req: { user } }) => isStaff(user),
      create: ({ req: { user } }) => isStaff(user),
    },
    fields: [
      {
        name: 'phone',
        type: 'text',
        required: true,
        index: true,
        admin: {
          description:
            'E.164, and how a returning party is recognised — the number their sign-in code is sent to. Not unique: one number can legitimately belong to more than one account, and the oldest wins.',
        },
      },
      {
        name: 'name',
        type: 'text',
        required: true,
        admin: {
          description:
            "How the storefront greets them — a copy of the party's display name in Vritti, which is the source of truth. Taken from there for a party the organization already knows, and asked for only when the number is new.",
        },
      },
      {
        name: 'partyId',
        type: 'text',
        index: true,
        admin: {
          readOnly: true,
          description:
            'The person in Vritti commerce that orders reference. Resolved when the code is verified: an existing party is reused when the organization already knows this number, so the same party at a sibling store is one person rather than two.',
        },
      },
      sessionsField,
      ...extraFields,
    ],
    timestamps: true,
  };
  return collection;
}

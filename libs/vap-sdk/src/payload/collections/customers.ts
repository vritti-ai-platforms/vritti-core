// Payload is ESM-only while this package emits CommonJS, so a type-only import needs to be told which
// resolution mode to read its `exports` map under. Safe precisely because it is type-only: nothing here
// imports a runtime value from payload, so there is no CJS/ESM interop at all in the built output.
import type { CollectionConfig, Field } from 'payload' with { 'resolution-mode': 'import' };
import type { CollectionLike } from '../runtime';

/** True for a staff account, false for a shopper or an anonymous request. */
function isStaff(user: { collection?: string } | null | undefined): boolean {
  return user?.collection === 'users';
}

/**
 * Payload's session store, declared by hand.
 *
 * Payload normally contributes this itself, but `getAuthFields` puts it inside the same branch as the
 * email and password columns — so `disableLocalStrategy: true` drops sessions along with them, and
 * there is no setting that keeps one without the other. Declaring it here is what lets the collection
 * be credential-free and still carry a session.
 *
 * The shape is Payload's own (`auth/baseFields/sessions.js`) and has to stay that way: the JWT
 * strategy looks up `decodedPayload.sid` in `user.sessions` and reads nothing else, so it works with
 * a field we declared — but only while the names match.
 */
const sessionsField: Field = {
  name: 'sessions',
  type: 'array',
  access: {
    // A session list is the one thing a shopper must not read about anyone else, and must never write.
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

/**
 * Storefront accounts — the people who sign in on the site itself.
 *
 * **This row holds no credentials.** Identity belongs to core: `partyId` is the person, and proving
 * you are them happens by verifying a one-time code sent to `phone`. What remains here is the minimum
 * Payload requires to hang a session on, because its session is an array field on an auth-collection
 * document rather than a table of its own.
 *
 * That is why `disableLocalStrategy` is on: no email, no password, no salt or hash, no reset tokens,
 * no lockout counters. None of them had an owner once the password went — they were machinery for a
 * login this app no longer performs.
 *
 * Deliberately not the `users` collection. Two auth collections cost nothing and buy a hard boundary:
 * only `users` is wired to `admin.user`, so a shopper has no route into the admin panel even if these
 * access rules were later loosened by mistake.
 *
 * `create` stays shut. Sign-in runs through a server action using the Local API, which bypasses these
 * rules — so closing `create` stops `POST /api/customers` being used to mint an account around the
 * verification that is supposed to precede one.
 */
export function customersCollection(extraFields: Field[] = []): CollectionLike {
  // Authored against CollectionConfig for the field-level safety, handed back opaque so the built types
  // never name one installed copy of payload.
  const collection: CollectionConfig = {
    slug: 'customers',
    labels: { singular: 'Customer', plural: 'Customers' },
    auth: {
      // Long enough that a shopper is not signed out mid-basket, short enough that a shared machine
      // forgets them within the week.
      tokenExpiration: 60 * 60 * 24 * 7,
      // No email/password login. Sessions are minted directly once core has confirmed a code, so the
      // local strategy has nothing to check and its columns have no owner.
      disableLocalStrategy: true,
    },
    admin: {
      useAsTitle: 'phone',
      defaultColumns: ['name', 'phone', 'partyId', 'createdAt'],
      group: 'Store',
      description: 'People who signed in on the storefront. Their identity lives in Vritti.',
    },
    access: {
      // Belt and braces. `admin.user` already excludes this collection from the panel; this makes the
      // intent unmissable to anyone reading the config.
      admin: () => false,
      // Staff see everyone; a shopper sees exactly their own record. Returning a query rather than
      // `true` is what keeps `GET /api/customers` from becoming a customer list for anyone holding a
      // session cookie.
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
            'E.164, and how a returning shopper is recognised — the number their sign-in code is sent to. Not unique: one number can legitimately belong to more than one account, and the oldest wins.',
        },
      },
      {
        name: 'name',
        type: 'text',
        required: true,
        admin: {
          description:
            'How the storefront greets them — a copy of the party\'s display name in Vritti, which is the source of truth. Taken from there for a shopper the organization already knows, and asked for only when the number is new.',
        },
      },
      {
        name: 'partyId',
        type: 'text',
        index: true,
        admin: {
          readOnly: true,
          description:
            'The person in Vritti commerce that orders reference. Resolved when the code is verified: an existing party is reused when the organization already knows this number, so the same shopper at a sibling store is one person rather than two.',
        },
      },
      sessionsField,
      ...extraFields,
    ],
    timestamps: true,
  };
  return collection;
}

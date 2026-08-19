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
 * Storefront accounts — the people who sign up and log in on the site itself.
 *
 * **The app owns shopper authentication.** The password, the session and the cookie all live in the
 * storefront's own database; core is never in the login path. What core owns is the *person*, and
 * `partyId` is the link to them.
 *
 * Deliberately not the `users` collection. Two auth collections cost nothing and buy a hard
 * boundary: only `users` is wired to `admin.user`, so a shopper account has no route into the admin
 * panel even if these access rules were later loosened by mistake.
 *
 * `create` stays shut on purpose. Signup runs through a server action using the Local API, which
 * bypasses these rules — so closing `create` stops `POST /api/customers` being used to register
 * around that action and whatever it keeps in step (the party, the `WEB_APP` reference).
 */
export function customersCollection(extraFields: Field[] = []): CollectionLike {
  // Authored against CollectionConfig for the field-level safety, handed back opaque so the built types
  // never name one installed copy of payload.
  const collection: CollectionConfig = {
    slug: 'customers',
    labels: { singular: 'Customer', plural: 'Customers' },
    auth: {
      // Long enough that a shopper is not logged out mid-basket, short enough that a shared machine
      // forgets them within the week.
      tokenExpiration: 60 * 60 * 24 * 7,
      maxLoginAttempts: 10,
      lockTime: 10 * 60 * 1000,
    },
    admin: {
      useAsTitle: 'email',
      defaultColumns: ['name', 'email', 'partyId', 'createdAt'],
      group: 'Store',
      description: 'People who registered on the storefront.',
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
        name: 'name',
        type: 'text',
        required: true,
        admin: {
          description: 'How the storefront greets them once they are signed in.',
        },
      },
      {
        name: 'phone',
        type: 'text',
        admin: {
          description:
            'Required at signup — it is one of the two channels Vritti matches a returning shopper by. Left nullable here so staff can add a customer without one, and so existing rows stay valid.',
        },
      },
      {
        name: 'partyId',
        type: 'text',
        index: true,
        admin: {
          readOnly: true,
          description:
            'The person in Vritti commerce that orders reference. Resolved at signup: an existing party is reused when this email or phone is already known to the organization, so the same shopper at a sibling store is one person rather than two.',
        },
      },
      ...extraFields,
    ],
    timestamps: true,
  };
  return collection;
}

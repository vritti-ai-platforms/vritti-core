import type { CollectionConfig } from 'payload'

import { isStaff } from '../lib/fields'

/**
 * Staff accounts — the only collection allowed into the admin panel
 * (`admin.user` in payload.config.ts).
 *
 * **Every operation is declared, including the ones that look obvious.** Payload
 * merges its defaults per key, and the default is
 * `({ req: { user } }) => Boolean(user)` — so a collection that declares only
 * `read` silently grants create, update and delete to anyone holding a session.
 * Payload issues one cookie for the whole app, so the moment a second
 * auth-enabled collection exists, that default lets a *shopper* list staff
 * emails, reset an admin's password, or create a staff account outright.
 *
 * All three sibling sites shipped that hole on this collection. It is the single
 * most consequential thing to declare, and it is why nothing here is left off.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Settings',
    description: 'Staff who can sign in to this admin panel.',
  },
  auth: true,
  access: {
    read: isStaff,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
    // Payload's own operation for clearing a lockout, and it has the same
    // permissive default as the rest.
    unlock: isStaff,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      admin: { description: 'Shown in the top-right of the admin panel.' },
    },
  ],
}

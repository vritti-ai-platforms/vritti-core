import type { Field } from 'payload'

/**
 * Field groups and access helpers shared across collections and globals.
 *
 * One rule runs through the copy fields: **UI labels carry a default, prose does
 * not.** "View all" is interface furniture, so an unpopulated install still
 * renders a usable page; a headline is a claim about the business, so it ships
 * blank and its section hides itself until someone writes one.
 */

/**
 * Staff, and not merely "somebody is signed in".
 *
 * Payload issues one cookie for the whole app, so as soon as a second
 * auth-enabled collection exists — a `customers` collection, which the vap
 * plugin adds — a bare `Boolean(req.user)` hands staff-only rows to any shopper
 * with an account who calls the REST API. Checking the collection means that day
 * changes nothing.
 *
 * Written as a function taking the whole argument object so it can be passed
 * straight to an access rule: `create: isStaff`.
 */
export function isStaff({ req }: { req: { user?: { collection?: string } | null } }): boolean {
  return req.user?.collection === 'users'
}

/** Turns any text into a URL-safe address, stripping accents rather than dropping them. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * A URL-safe address, filled in from another field when left blank.
 *
 * What it does **not** do is rewrite a slug that already has a value: once a
 * page has an address other links depend on it, and silently changing it because
 * someone fixed a typo in the title would break every one of them. Clear the
 * field to regenerate deliberately.
 *
 * Not `required`, because the generated value arrives server-side and a required
 * field would have the panel refuse to submit before it ever got there.
 * `validate` still insists on one, so a slug can never actually be missing.
 */
export function slugField(description: string, from = 'title'): Field {
  return {
    name: 'slug',
    type: 'text',
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: `${description} Leave blank and it is made from the ${from}.`,
    },
    hooks: {
      beforeValidate: [
        ({ value, data }) => {
          const typed = typeof value === 'string' ? value.trim() : ''
          if (typed) return slugify(typed)
          const source = (data as Record<string, unknown> | undefined)?.[from]
          return typeof source === 'string' && source.trim() ? slugify(source) : value
        },
      ],
    },
    validate: (value: string | null | undefined) => {
      if (!value) return 'This needs an address, or a title to make one from.'
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
        return 'Lowercase letters, numbers and single hyphens only — no spaces, no capitals.'
      }
      return true
    },
  }
}

/** Per-page search metadata. */
export function pageSeo(): Field {
  return {
    name: 'seo',
    type: 'group',
    label: 'Search & sharing',
    fields: [
      {
        name: 'title',
        type: 'text',
        admin: {
          description:
            'Browser tab and search result title. The site name is appended automatically, so leave it out. Falls back to the page name.',
        },
      },
      {
        name: 'description',
        type: 'textarea',
        admin: { description: 'Search result snippet. Around 150 characters.' },
      },
    ],
  }
}

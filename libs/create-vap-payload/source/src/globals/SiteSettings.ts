import type { GlobalConfig } from 'payload'

import { isStaff } from './pageFields'

/**
 * The things that are true on every page — the name, the navigation, the footer.
 *
 * A global rather than a collection because there is exactly one of each. Copy
 * belongs here and not in a component: every user-facing string on the site
 * should be a field an editor can change, and the `||` fallbacks in the page
 * files exist to cover an editor clearing one, not as the place copy is written.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: {
    group: 'Settings',
    description: 'The name, the navigation and the footer — everything that appears on every page.',
  },
  access: {
    read: () => true,
    update: isStaff,
  },
  fields: [
    {
      name: 'brand',
      type: 'group',
      fields: [
        {
          name: 'wordmark',
          type: 'text',
          required: true,
          defaultValue: '__BRAND__',
          admin: {
            description: 'The name in the header, and the name appended to every page title.',
          },
        },
        {
          name: 'tagline',
          type: 'text',
          admin: { description: 'Sits beside the wordmark in the footer. Optional.' },
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Default search-result snippet for pages that set none of their own.',
          },
        },
        // #region feature:media
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description:
              'Shown in the header in place of the wordmark. Without one the header sets the name in type.',
          },
        },
        // #endregion feature:media
        {
          name: 'currencySymbol',
          type: 'text',
          defaultValue: '₹',
          admin: {
            description:
              'Drawn before every price. Prices themselves are stored as plain numbers, so this is the one place the currency is written.',
          },
        },
      ],
    },
    {
      name: 'nav',
      type: 'array',
      label: 'Header links',
      labels: { singular: 'Link', plural: 'Links' },
      admin: { description: 'Left to right. Remove them all and the header shows the name alone.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true, admin: { description: 'A path like /about.' } },
          ],
        },
      ],
    },
    {
      name: 'footer',
      type: 'group',
      fields: [
        {
          name: 'note',
          type: 'text',
          admin: { description: 'The line at the bottom. The year is added automatically.' },
        },
      ],
    },
  ],
}

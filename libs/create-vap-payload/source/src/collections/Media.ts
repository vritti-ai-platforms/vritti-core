import type { CollectionConfig } from 'payload'

import { isStaff } from '../lib/fields'

/**
 * Every picture the site renders.
 *
 * There are no image files in this repository and there should never be: put
 * them here and the whole site can be re-skinned from the panel without a
 * deploy.
 *
 * `read` is public because the pages are, but the writes are staff-only and
 * declared explicitly — leaving them off would hand upload and delete to anyone
 * with a session, and deleting media breaks every page that referenced it.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Settings',
    description:
      'Photographs and logos. Upload once and pick the file wherever it is needed — the same picture can be used in more than one place.',
  },
  access: {
    read: () => true,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'What the picture shows, in a short phrase. Read aloud by screen readers and shown if the image fails to load — describe the subject, not the slot it fills.',
      },
    },
  ],
  upload: {
    /**
     * No `staticDir`. Every file goes to the bucket — the S3 adapter sets
     * `disableLocalStorage` on this collection, so nothing is written to the
     * container's filesystem in any environment, dev included.
     *
     * A disk-backed upload survives only until the container is replaced, and
     * then every image 404s. Nothing here needs a writable app directory either:
     * sharp resizes through the OS temp directory and the adapter streams the
     * result to the bucket.
     */
    mimeTypes: ['image/*'],
    // Add the crops the design actually uses, so next/image never has to work
    // down from a multi-megabyte original. Each one is a real column, so adding
    // or renaming one needs a migration.
    imageSizes: [{ name: 'card', width: 800, height: 600, position: 'centre' }],
    focalPoint: true,
  },
}

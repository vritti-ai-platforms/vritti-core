/**
 * Which documents have an address on the site, and what it is.
 *
 * **One map, read by three callers**: the Live Preview pane, a collection's
 * Preview button, and any route that needs to know where a document lives. A
 * second list is how one of them ends up pointing at a route that moved.
 */

/** Collections whose edit view gets the preview pane. Slugs, in Payload's order. */
export const LIVE_PREVIEW_COLLECTIONS: string[] = []

/** Globals whose edit view gets the preview pane. */
export const LIVE_PREVIEW_GLOBALS: string[] = ['site-settings']

/**
 * The path a document is shown at, or null when it has none yet.
 *
 * Null hides the pane and the button, which is the right answer for a document
 * whose slug has not been typed — the alternative frames a 404 and reads as a
 * broken preview rather than an unfinished document.
 */
export function previewPath({
  globalSlug,
  collectionSlug,
  data,
}: {
  globalSlug?: string
  collectionSlug?: string
  data?: Record<string, unknown>
}): string | null {
  // Site settings appear on every page, so the home page is the honest preview.
  if (globalSlug === 'site-settings') return '/'
  if (globalSlug) return '/'

  const slug = typeof data?.slug === 'string' ? data.slug : ''
  if (!collectionSlug || !slug) return null

  // Add a case per previewable collection as routes are added.
  return null
}

/**
 * The origin the panel was reached on.
 *
 * Built from the request's own headers rather than from a Site settings field:
 * admin and site are one Next app, so the page being previewed is always on this
 * host. A canonical origin would frame production while you edit locally.
 */
export function originFromHeaders(headers: Headers): string {
  const host = headers.get('x-forwarded-host') ?? headers.get('host') ?? 'localhost:3000'
  const protocol = (headers.get('x-forwarded-proto') ?? '').split(',')[0]?.trim()
  const scheme = protocol || (host.startsWith('localhost') ? 'http' : 'https')
  return `${scheme}://${host}`
}

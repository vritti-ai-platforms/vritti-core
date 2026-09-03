import type { Metadata } from 'next'

/**
 * Turns a page's own SEO group into Next metadata, falling back to the site's.
 *
 * The title suffix is set once in payload.config's `admin.meta`, and Next
 * appends the site name itself through the layout's template — so a page title
 * here is the page's half only.
 */
export function pageMetadata({
  title,
  description,
  fallbackDescription,
}: {
  title?: string | null
  description?: string | null
  fallbackDescription?: string | null
}): Metadata {
  const meta: Metadata = {}
  if (title?.trim()) meta.title = title.trim()
  const body = description?.trim() || fallbackDescription?.trim()
  if (body) meta.description = body
  return meta
}

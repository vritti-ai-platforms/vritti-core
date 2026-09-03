import { getPayload } from 'payload'

import config from '@/payload.config'

/**
 * The parts of Site settings the header, footer and metadata read.
 *
 * Declared here rather than imported from `@/payload-types`, and that is
 * deliberate: those types are *generated* by `pnpm generate:types`, so a repo
 * that has just been scaffolded does not have them yet. Anything shipped by the
 * generator that imported them would make a fresh clone fail to typecheck
 * before it had done anything wrong — the worst possible first impression, and
 * one that CI cannot paper over either.
 *
 * Once the file exists, `Config['globals']['site-settings']` is the precise
 * type and this can be narrowed to it. Until then a structural type over the
 * fields this code actually touches is both honest and sufficient.
 */
export interface SiteChrome {
  brand?: {
    wordmark?: string | null
    tagline?: string | null
    description?: string | null
    currencySymbol?: string | null
  } | null
  nav?: { id?: string | null; label: string; href: string }[] | null
  footer?: { note?: string | null } | null
}

/**
 * Site settings, for the header, the footer and page metadata.
 *
 * `depth: 0` unless a caller needs an upload populated — every page loads this,
 * so the difference between one query and three is a difference on every
 * request.
 */
export async function getSiteSettings(depth = 0): Promise<SiteChrome> {
  const payload = await getPayload({ config: await config })
  const settings = await payload.findGlobal({ slug: 'site-settings', depth })
  return settings as SiteChrome
}

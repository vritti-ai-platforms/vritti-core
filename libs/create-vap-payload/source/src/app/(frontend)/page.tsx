import { getSiteSettings } from '@/lib/site'

export const dynamic = 'force-dynamic'

/**
 * The home page.
 *
 * Deliberately almost empty: a fresh install renders the chrome and this note,
 * and the site fills in as its collections and globals are authored. Nothing
 * here should ever hardcode a headline — copy belongs in a global so an editor
 * can change it without a deploy.
 */
export default async function HomePage() {
  const settings = await getSiteSettings()

  return (
    <section className="prose">
      <h1>{settings.brand?.wordmark || '__BRAND__'}</h1>
      {settings.brand?.tagline && <p className="lead">{settings.brand.tagline}</p>}
      <p>
        This page is rendered from Site settings. Open <code>/admin</code> to edit the name, the
        header links and the footer, then build the pages this site actually needs.
      </p>
    </section>
  )
}

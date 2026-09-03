import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { getSiteSettings } from '@/lib/site'
import './styles.css'

/**
 * Content lives in Postgres and the site origin is an admin setting, so nothing
 * here can be computed at build time — and the Docker image is built with no
 * database at all. Every route is rendered per request.
 */
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const name = settings.brand?.wordmark || '__BRAND__'
  return {
    // Next appends the site name to every page's own title through this
    // template, which is why a page sets only its half.
    title: { default: name, template: `%s — ${name}` },
    description: settings.brand?.description || undefined,
  }
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  const name = settings.brand?.wordmark || '__BRAND__'
  const links = settings.nav ?? []

  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="site-header__mark" href="/">
            {name}
          </Link>
          {links.length > 0 && (
            <nav className="site-header__nav" aria-label="Main">
              {links.map((link) => (
                <Link key={link.id ?? link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </header>

        <main className="site-main">{children}</main>

        <footer className="site-footer">
          <span>
            © {new Date().getFullYear()} {name}
          </span>
          {settings.footer?.note && <span>{settings.footer.note}</span>}
        </footer>
      </body>
    </html>
  )
}
